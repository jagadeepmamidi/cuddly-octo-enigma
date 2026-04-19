import { recordAudit } from "@/lib/audit/service";
import { getBookingOrThrow, listBookings, updateBooking } from "@/lib/data/repository";
import type { Role } from "@/lib/types/domain";
import type { RejectBookingRequest } from "@/lib/types/contracts";
import { assertCanTransition } from "@/lib/bookings/state-machine";
import { ApiException } from "@/lib/utils/errors";

export async function listBookingsForAdmin(filters?: { status?: string }) {
  return listBookings({ status: filters?.status });
}

export async function rejectBooking(
  bookingId: string,
  input: RejectBookingRequest,
  actor: { userId: string; role: Role }
) {
  if (actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Only admin can reject bookings.");
  }

  const booking = await getBookingOrThrow(bookingId);
  const rejectableFrom = new Set(["pending_kyc", "payment_pending", "confirmed"]);
  if (!rejectableFrom.has(booking.status)) {
    throw new ApiException(
      409,
      "invalid_state",
      `Cannot reject booking in status ${booking.status}.`
    );
  }

  assertCanTransition(booking.status, "cancelled", "admin.reject_booking");
  const updated = await updateBooking(booking.id, {
    status: "cancelled",
    cancel_reason: input.reason,
    updated_at: new Date().toISOString()
  });

  await recordAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "admin.booking_reject",
    resourceType: "booking",
    resourceId: booking.id,
    metadata: {
      reason: input.reason
    }
  });

  return updated;
}
