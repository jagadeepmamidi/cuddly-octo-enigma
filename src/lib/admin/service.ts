import { recordAudit } from "@/lib/audit/service";
import { getBookingOrThrow } from "@/lib/data/repository";
import { store } from "@/lib/data/store";
import type { Role } from "@/lib/types/domain";
import type { RejectBookingRequest } from "@/lib/types/contracts";
import { assertCanTransition } from "@/lib/bookings/state-machine";
import { ApiException } from "@/lib/utils/errors";

export function listBookingsForAdmin(filters?: { status?: string }) {
  if (!filters?.status) {
    return store.bookings;
  }
  return store.bookings.filter((booking) => booking.status === filters.status);
}

export function rejectBooking(
  bookingId: string,
  input: RejectBookingRequest,
  actor: { userId: string; role: Role }
) {
  if (actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Only admin can reject bookings.");
  }

  const booking = getBookingOrThrow(bookingId);
  const rejectableFrom = new Set(["pending_kyc", "payment_pending", "confirmed"]);
  if (!rejectableFrom.has(booking.status)) {
    throw new ApiException(
      409,
      "invalid_state",
      `Cannot reject booking in status ${booking.status}.`
    );
  }

  assertCanTransition(booking.status, "cancelled", "admin.reject_booking");
  booking.status = "cancelled";
  booking.cancel_reason = input.reason;
  booking.updated_at = new Date().toISOString();

  recordAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "admin.booking_reject",
    resourceType: "booking",
    resourceId: booking.id,
    metadata: {
      reason: input.reason
    }
  });

  return booking;
}
