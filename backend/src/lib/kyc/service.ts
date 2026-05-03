import { recordAudit } from "@/lib/audit/service";
import {
  getKycByRequestId,
  getKycRecordOrThrow,
  getUserOrThrow,
  listManualReviewKyc,
  upsertKycRecord,
  upsertUser
} from "@/lib/data/repository";
import type { KycRecord, Role } from "@/lib/types/domain";
import { createDigilockerRequest } from "@/lib/integrations/setu-digilocker";
import { fetchDigilockerRequestStatus } from "@/lib/integrations/setu-digilocker";
import { ApiException } from "@/lib/utils/errors";
import { newId } from "@/lib/utils/ids";

function readPath(input: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[key];
  }, input);
}

function firstValue(input: unknown, paths: string[][]): unknown {
  for (const path of paths) {
    const value = readPath(input, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "verified", "success", "matched", "yes"].includes(normalized)) return true;
    if (["false", "failed", "failure", "mismatch", "no"].includes(normalized)) return false;
  }
  return undefined;
}

function coerceCibilScore(value: unknown): number | null | undefined {
  if (value === null) return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  const score = Math.round(numberValue);
  if (score < 300 || score > 900) {
    throw new ApiException(400, "invalid_cibil_score", "CIBIL score must be between 300 and 900.");
  }
  return score;
}

function resolveCibilRiskLevel(score: number | null | undefined) {
  if (score === null || score === undefined) return null;
  const highRiskThreshold = Number(process.env.CIBIL_HIGH_RISK_BELOW ?? 650);
  const mediumRiskThreshold = Number(process.env.CIBIL_MEDIUM_RISK_BELOW ?? 700);
  if (score < highRiskThreshold) return "high" as const;
  if (score < mediumRiskThreshold) return "medium" as const;
  return "low" as const;
}

export function normalizeKycCallbackPayload(input: Record<string, unknown>) {
  const statusValue = firstValue(input, [
    ["status"],
    ["data", "status"],
    ["event", "status"],
    ["digilocker", "status"],
    ["verification", "status"]
  ]);
  const normalizedStatus =
    typeof statusValue === "string" ? statusValue.trim().toLowerCase() : undefined;

  const requestId = firstValue(input, [
    ["requestId"],
    ["request_id"],
    ["id"],
    ["data", "requestId"],
    ["data", "request_id"],
    ["data", "id"],
    ["digilocker", "requestId"],
    ["digilocker", "request_id"]
  ]);
  const aadhaarValue = firstValue(input, [
    ["aadhaarVerified"],
    ["aadhaar_verified"],
    ["aadhaar", "verified"],
    ["data", "aadhaarVerified"],
    ["data", "aadhaar_verified"],
    ["documents", "aadhaar", "verified"]
  ]);
  const dlValue = firstValue(input, [
    ["dlVerified"],
    ["dl_verified"],
    ["drivingLicenseVerified"],
    ["driving_license_verified"],
    ["driving_license", "verified"],
    ["data", "dlVerified"],
    ["data", "dl_verified"],
    ["documents", "driving_license", "verified"]
  ]);
  const cibilValue = firstValue(input, [
    ["cibilScore"],
    ["cibil_score"],
    ["creditScore"],
    ["credit_score"],
    ["data", "cibilScore"],
    ["data", "cibil_score"],
    ["bureau", "cibil_score"]
  ]);
  const failureReason = firstValue(input, [
    ["failureReason"],
    ["failure_reason"],
    ["error"],
    ["error", "message"],
    ["data", "failureReason"],
    ["data", "failure_reason"]
  ]);

  return {
    requestId: typeof requestId === "string" ? requestId : undefined,
    status:
      normalizedStatus === "verified" ||
      normalizedStatus === "success" ||
      normalizedStatus === "completed"
        ? "verified"
        : normalizedStatus === "failed" || normalizedStatus === "failure"
          ? "failed"
          : normalizedStatus === "manual_review" || normalizedStatus === "review_required"
            ? "manual_review"
            : undefined,
    aadhaarVerified: coerceBoolean(aadhaarValue),
    dlVerified: coerceBoolean(dlValue),
    cibilScore: coerceCibilScore(cibilValue),
    failureReason: typeof failureReason === "string" ? failureReason : undefined
  };
}

function resolveKycCallbackStatus(input: {
  status?: string;
  aadhaarVerified?: boolean;
  dlVerified?: boolean;
  cibilRiskLevel?: "low" | "medium" | "high" | null;
}) {
  if (input.status === "failed") {
    return "failed" as const;
  }
  if (input.status === "verified") {
    return input.aadhaarVerified && input.dlVerified && input.cibilRiskLevel !== "high"
      ? ("verified" as const)
      : ("manual_review" as const);
  }
  return "manual_review" as const;
}

async function getOrCreateKycRecord(userId: string): Promise<KycRecord> {
  try {
    return await getKycRecordOrThrow(userId);
  } catch (error) {
    if (!(error instanceof ApiException) || error.code !== "kyc_not_found") {
      throw error;
    }
    return upsertKycRecord({
      user_id: userId,
      status: "not_started",
      provider: "setu_digilocker",
      aadhaar_verified: false,
      dl_verified: false,
      needs_manual_review: false,
      updated_at: new Date().toISOString()
    });
  }
}

export async function startDigilockerKyc(userId: string) {
  const user = await getUserOrThrow(userId);
  const kyc = await getOrCreateKycRecord(userId);

  let providerResponse: {
    id?: string;
    requestId?: string;
    referenceId?: string;
    url?: string;
    status?: string;
  } | null = null;

  try {
    providerResponse = (await createDigilockerRequest()) as {
      id?: string;
      requestId?: string;
      referenceId?: string;
      url?: string;
      status?: string;
    };
  } catch {
    providerResponse = null;
  }

  const requestId =
    providerResponse?.requestId ??
    providerResponse?.id ??
    kyc.request_id ??
    newId("kyc_req");
  const referenceId = providerResponse?.referenceId ?? newId("kyc_ref");

  const updatedKyc = await upsertKycRecord({
    ...kyc,
    status: "in_progress",
    request_id: requestId,
    reference_id: referenceId,
    updated_at: new Date().toISOString()
  });
  await upsertUser({
    ...user,
    kyc_status: "in_progress"
  });

  await recordAudit({
    actorId: userId,
    actorRole: user.role,
    action: "kyc.start_digilocker",
    resourceType: "kyc",
    resourceId: userId,
    metadata: {
      request_id: updatedKyc.request_id,
      reference_id: updatedKyc.reference_id
    }
  });

  return {
    user_id: userId,
    provider: "setu_digilocker",
    request_id: updatedKyc.request_id,
    reference_id: updatedKyc.reference_id,
    status: updatedKyc.status,
    redirect_url: providerResponse?.url ?? null,
    next_step: providerResponse?.url
      ? "redirect_to_digilocker_consent"
      : "poll_kyc_status"
  };
}

export async function getKycStatus(userId: string) {
  const kyc = await getOrCreateKycRecord(userId);
  return {
    user_id: userId,
    status: kyc.status,
    request_id: kyc.request_id,
    reference_id: kyc.reference_id,
    aadhaar_verified: kyc.aadhaar_verified,
    dl_verified: kyc.dl_verified,
    cibil_score: kyc.cibil_score ?? null,
    needs_manual_review: kyc.needs_manual_review,
    updated_at: kyc.updated_at
  };
}

export async function handleDigilockerCallback(input: {
  requestId?: string;
  status?: string;
  aadhaarVerified?: boolean;
  dlVerified?: boolean;
  cibilScore?: number | null;
  failureReason?: string;
}) {
  if (!input.requestId) {
    throw new ApiException(400, "request_id_required", "Missing requestId in callback.");
  }

  const current = await getKycByRequestId(input.requestId);
  if (!current) {
    throw new ApiException(404, "kyc_not_found", "No KYC record found for requestId.");
  }

  const cibilScore = input.cibilScore ?? current.cibil_score ?? null;
  const cibilRiskLevel = resolveCibilRiskLevel(cibilScore);
  const status = resolveKycCallbackStatus({ ...input, cibilRiskLevel });

  const updated = await upsertKycRecord({
    ...current,
    status,
    aadhaar_verified: Boolean(input.aadhaarVerified),
    dl_verified: Boolean(input.dlVerified),
    cibil_score: cibilScore,
    cibil_risk_level: cibilRiskLevel,
    needs_manual_review: status === "manual_review",
    failure_reason:
      input.failureReason ??
      (cibilRiskLevel === "high" ? "cibil_score_below_policy_threshold" : undefined),
    updated_at: new Date().toISOString()
  });

  const user = await getUserOrThrow(current.user_id);
  await upsertUser({
    ...user,
    kyc_status: status
  });

  await recordAudit({
    actorId: "system_kyc_callback",
    actorRole: "admin",
    action: "kyc.callback_processed",
    resourceType: "kyc",
    resourceId: current.user_id,
    metadata: {
      request_id: input.requestId,
      status
    }
  });

  return updated;
}

export async function getKycRequestForActor(
  requestId: string,
  actor: { userId: string; role: Role }
) {
  const record = await getKycByRequestId(requestId);
  if (!record) {
    throw new ApiException(404, "kyc_not_found", "No KYC record found for requestId.");
  }
  if (actor.role !== "admin" && record.user_id !== actor.userId) {
    throw new ApiException(403, "forbidden", "Not allowed to access this KYC request.");
  }
  return record;
}

export async function markKycManualReview(userId: string, actorId: string) {
  const user = await getUserOrThrow(userId);
  const kyc = await getKycRecordOrThrow(userId);
  const updated = await upsertKycRecord({
    ...kyc,
    status: "manual_review",
    needs_manual_review: true,
    updated_at: new Date().toISOString()
  });
  await upsertUser({
    ...user,
    kyc_status: "manual_review"
  });

  await recordAudit({
    actorId,
    actorRole: "admin",
    action: "kyc.mark_manual_review",
    resourceType: "kyc",
    resourceId: userId
  });

  return updated;
}

export async function approveKyc(userId: string, actorId: string) {
  const user = await getUserOrThrow(userId);
  const kyc = await getKycRecordOrThrow(userId);
  const updated = await upsertKycRecord({
    ...kyc,
    status: "verified",
    needs_manual_review: false,
    aadhaar_verified: true,
    dl_verified: true,
    updated_at: new Date().toISOString()
  });
  await upsertUser({
    ...user,
    kyc_status: "verified"
  });

  await recordAudit({
    actorId,
    actorRole: "admin",
    action: "kyc.approve",
    resourceType: "kyc",
    resourceId: userId
  });
  return updated;
}

export async function rejectKyc(userId: string, actorId: string, reason: string) {
  const user = await getUserOrThrow(userId);
  const kyc = await getKycRecordOrThrow(userId);
  const updated = await upsertKycRecord({
    ...kyc,
    status: "failed",
    needs_manual_review: false,
    failure_reason: reason,
    updated_at: new Date().toISOString()
  });
  await upsertUser({
    ...user,
    kyc_status: "failed"
  });

  await recordAudit({
    actorId,
    actorRole: "admin",
    action: "kyc.reject",
    resourceType: "kyc",
    resourceId: userId,
    metadata: { reason }
  });
  return updated;
}

export async function listPendingKycManualReview() {
  const pending = await listManualReviewKyc();
  return pending.map((item) => ({
    user_id: item.user_id,
    status: item.status,
    updated_at: item.updated_at
  }));
}

export async function pollDigilockerStatus(
  requestId: string,
  actor: { userId: string; role: Role }
) {
  await getKycRequestForActor(requestId, actor);
  const payload = (await fetchDigilockerRequestStatus(requestId)) as Record<string, unknown>;
  const normalized = normalizeKycCallbackPayload({ requestId, ...payload });
  const status = await handleDigilockerCallback({
    requestId,
    status: normalized.status,
    aadhaarVerified: normalized.aadhaarVerified,
    dlVerified: normalized.dlVerified,
    cibilScore: normalized.cibilScore,
    failureReason: normalized.failureReason
  });

  return {
    provider_payload: payload,
    updated_status: status.status
  };
}
