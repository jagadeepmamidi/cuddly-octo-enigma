import { recordAudit } from "@/lib/audit/service";
import {
  getKycByRequestId,
  getKycRecordOrThrow,
  getUserOrThrow,
  listManualReviewKyc,
  upsertKycRecord,
  upsertUser
} from "@/lib/data/repository";
import { createDigilockerRequest } from "@/lib/integrations/setu-digilocker";
import { fetchDigilockerRequestStatus } from "@/lib/integrations/setu-digilocker";
import { ApiException } from "@/lib/utils/errors";
import { newId } from "@/lib/utils/ids";

export async function startDigilockerKyc(userId: string) {
  const user = await getUserOrThrow(userId);
  const kyc = await getKycRecordOrThrow(userId);

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
  const kyc = await getKycRecordOrThrow(userId);
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

  const verifiedByDocs = Boolean(input.aadhaarVerified && input.dlVerified);
  const status =
    input.status === "failed"
      ? "failed"
      : verifiedByDocs
        ? "verified"
        : "manual_review";

  const updated = await upsertKycRecord({
    ...current,
    status,
    aadhaar_verified: Boolean(input.aadhaarVerified),
    dl_verified: Boolean(input.dlVerified),
    cibil_score: input.cibilScore ?? current.cibil_score ?? null,
    needs_manual_review: status === "manual_review",
    failure_reason: input.failureReason,
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

export async function pollDigilockerStatus(requestId: string) {
  const payload = (await fetchDigilockerRequestStatus(requestId)) as {
    status?: string;
    aadhaarVerified?: boolean;
    dlVerified?: boolean;
    cibilScore?: number;
    failureReason?: string;
  };
  const status = await handleDigilockerCallback({
    requestId,
    status: payload.status as "verified" | "failed" | "manual_review" | undefined,
    aadhaarVerified: payload.aadhaarVerified,
    dlVerified: payload.dlVerified,
    cibilScore: payload.cibilScore,
    failureReason: payload.failureReason
  });

  return {
    provider_payload: payload,
    updated_status: status.status
  };
}
