import { requireActor } from "@/lib/auth/context";
import { pollDigilockerStatus } from "@/lib/kyc/service";
import { ok, fromError } from "@/lib/utils/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    await requireActor(request, ["customer", "admin"]);
    const { requestId } = await context.params;
    const result = await pollDigilockerStatus(requestId);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}

