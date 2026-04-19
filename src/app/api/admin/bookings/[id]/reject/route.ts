import { requireActor } from "@/lib/auth/context";
import { rejectBooking } from "@/lib/admin/service";
import type { RejectBookingRequest } from "@/lib/types/contracts";
import { parseJson, ok, fromError } from "@/lib/utils/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireActor(request, ["admin"]);
    const body = await parseJson<RejectBookingRequest>(request);
    const { id } = await context.params;
    const booking = rejectBooking(id, body, actor);
    return ok({ booking });
  } catch (error) {
    return fromError(error);
  }
}

