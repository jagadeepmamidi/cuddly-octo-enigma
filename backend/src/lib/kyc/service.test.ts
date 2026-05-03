import { describe, expect, it } from "vitest";
import { handleDigilockerCallback, normalizeKycCallbackPayload } from "@/lib/kyc/service";
import { store } from "@/lib/data/store";

describe("kyc service", () => {
  it("normalizes nested provider callback payloads", () => {
    const normalized = normalizeKycCallbackPayload({
      data: {
        request_id: "kyc_req_nested",
        status: "completed",
        aadhaar_verified: "matched",
        dl_verified: "verified",
        cibil_score: "742"
      }
    });

    expect(normalized).toEqual({
      requestId: "kyc_req_nested",
      status: "verified",
      aadhaarVerified: true,
      dlVerified: true,
      cibilScore: 742,
      failureReason: undefined
    });
  });

  it("sends low CIBIL score KYC to manual review", async () => {
    process.env.CIBIL_HIGH_RISK_BELOW = "650";
    const userId = "cust_002";
    const requestId = "kyc_req_cibil_high_risk";
    const existingIndex = store.kycRecords.findIndex((item) => item.user_id === userId);
    store.kycRecords[existingIndex] = {
      ...store.kycRecords[existingIndex],
      status: "in_progress",
      request_id: requestId,
      aadhaar_verified: false,
      dl_verified: false,
      needs_manual_review: false,
      updated_at: new Date().toISOString()
    };

    const updated = await handleDigilockerCallback({
      requestId,
      status: "verified",
      aadhaarVerified: true,
      dlVerified: true,
      cibilScore: 610
    });

    expect(updated.status).toBe("manual_review");
    expect(updated.cibil_risk_level).toBe("high");
    expect(updated.needs_manual_review).toBe(true);
  });
});
