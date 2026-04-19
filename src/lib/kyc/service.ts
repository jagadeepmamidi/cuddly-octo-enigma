import { store } from "@/lib/data/store";
import { getKycRecordOrThrow, getUserOrThrow } from "@/lib/data/repository";
import { recordAudit } from "@/lib/audit/service";
import { newId } from "@/lib/utils/ids";

export function startDigilockerKyc(userId: string) {
  getUserOrThrow(userId);
  const kyc = getKycRecordOrThrow(userId);

  kyc.status = "in_progress";
  kyc.request_id = newId("kyc_req");
  kyc.updated_at = new Date().toISOString();

  const user = getUserOrThrow(userId);
  user.kyc_status = "in_progress";

  recordAudit({
    actorId: userId,
    actorRole: user.role,
    action: "kyc.start_digilocker",
    resourceType: "kyc",
    resourceId: userId,
    metadata: { request_id: kyc.request_id }
  });

  return {
    user_id: userId,
    provider: "setu_digilocker",
    request_id: kyc.request_id,
    status: kyc.status,
    next_step: "redirect_to_digilocker_consent"
  };
}

export function getKycStatus(userId: string) {
  const kyc = getKycRecordOrThrow(userId);
  return {
    user_id: userId,
    status: kyc.status,
    aadhaar_verified: kyc.aadhaar_verified,
    dl_verified: kyc.dl_verified,
    needs_manual_review: kyc.needs_manual_review,
    updated_at: kyc.updated_at
  };
}

export function markKycManualReview(userId: string, actorId: string) {
  const user = getUserOrThrow(userId);
  const kyc = getKycRecordOrThrow(userId);
  kyc.status = "manual_review";
  kyc.needs_manual_review = true;
  kyc.updated_at = new Date().toISOString();
  user.kyc_status = "manual_review";

  recordAudit({
    actorId,
    actorRole: "admin",
    action: "kyc.mark_manual_review",
    resourceType: "kyc",
    resourceId: userId
  });
}

export function approveKyc(userId: string, actorId: string) {
  const user = getUserOrThrow(userId);
  const kyc = getKycRecordOrThrow(userId);
  kyc.status = "verified";
  kyc.needs_manual_review = false;
  kyc.aadhaar_verified = true;
  kyc.dl_verified = true;
  kyc.updated_at = new Date().toISOString();
  user.kyc_status = "verified";

  recordAudit({
    actorId,
    actorRole: "admin",
    action: "kyc.approve",
    resourceType: "kyc",
    resourceId: userId
  });
}

export function listPendingKycManualReview() {
  const pending = store.kycRecords.filter((item) => item.status === "manual_review");
  return pending.map((item) => ({
    user_id: item.user_id,
    status: item.status,
    updated_at: item.updated_at
  }));
}

