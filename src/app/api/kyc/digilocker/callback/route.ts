import { handleDigilockerCallback } from "@/lib/kyc/service";
import type { KycCallbackRequest } from "@/lib/types/contracts";
import { parseJson, ok, fromError } from "@/lib/utils/http";

export async function POST(request: Request) {
  try {
    const body = await parseJson<KycCallbackRequest>(request);
    const updated = await handleDigilockerCallback({
      requestId: body.requestId,
      status: body.status,
      aadhaarVerified: body.aadhaarVerified,
      dlVerified: body.dlVerified,
      cibilScore: body.cibilScore,
      failureReason: body.failureReason
    });
    return ok({ kyc: updated });
  } catch (error) {
    return fromError(error);
  }
}

