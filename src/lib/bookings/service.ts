import { recordAudit } from "@/lib/audit/service";
import {
  assertBengaluruCity,
  getBookingOrThrow,
  getKycRecordOrThrow,
  getUserOrThrow,
  getVehicleOrThrow
} from "@/lib/data/repository";
import { store } from "@/lib/data/store";
import type {
  CancelBookingRequest,
  CreateBookingRequest,
  ExtendBookingRequest,
  QuoteRequest
} from "@/lib/types/contracts";
import type { PricingQuote, Role } from "@/lib/types/domain";
import { assertCanTransition } from "@/lib/bookings/state-machine";
import { computeCancellationBreakup, computePricingQuote } from "@/lib/pricing/engine";
import { ApiException } from "@/lib/utils/errors";
import { newId } from "@/lib/utils/ids";

export function createBooking(input: CreateBookingRequest, actor: { userId: string; role: Role }) {
  assertBengaluruCity(input.city);

  if (actor.role !== "customer" && actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Only customer or admin can create booking.");
  }
  if (actor.role === "customer" && actor.userId !== input.user_id) {
    throw new ApiException(403, "forbidden", "Customer can create booking only for self.");
  }

  const user = getUserOrThrow(input.user_id);
  const vehicle = getVehicleOrThrow(input.vehicle_id);
  const kyc = getKycRecordOrThrow(input.user_id);
  const pickupTs = new Date(input.pickup_at).getTime();
  const dropTs = new Date(input.drop_at).getTime();

  if (!Number.isFinite(pickupTs) || !Number.isFinite(dropTs) || pickupTs >= dropTs) {
    throw new ApiException(
      400,
      "invalid_booking_window",
      "Pickup time must be before drop time."
    );
  }

  if (vehicle.city !== "bengaluru") {
    throw new ApiException(
      400,
      "unsupported_city",
      "Vehicle is not available in Bengaluru."
    );
  }

  const quoteInput: QuoteRequest = {
    user_id: input.user_id,
    vehicle_id: input.vehicle_id,
    city: input.city,
    duration_bucket: input.duration_bucket,
    duration_value: input.duration_value,
    extra_helmet_count: input.extra_helmet_count,
    coupon_code: input.coupon_code
  };
  const quote = computePricingQuote(quoteInput);
  const now = new Date().toISOString();

  if (isVehicleBlockedDuring(input.vehicle_id, input.pickup_at, input.drop_at)) {
    throw new ApiException(
      409,
      "vehicle_blocked",
      "Vehicle has a maintenance/block window in requested time."
    );
  }
  if (hasVehicleBookingOverlap(input.vehicle_id, input.pickup_at, input.drop_at)) {
    throw new ApiException(
      409,
      "vehicle_unavailable",
      "Vehicle is already booked for requested time."
    );
  }

  const booking = {
    id: newId("booking"),
    user_id: input.user_id,
    vehicle_id: input.vehicle_id,
    city: "bengaluru" as const,
    status: kyc.status === "verified" ? ("payment_pending" as const) : ("pending_kyc" as const),
    pickup_at: input.pickup_at,
    drop_at: input.drop_at,
    quote,
    coupon_code: input.coupon_code,
    km_limit_bucket: input.km_limit_bucket,
    km_limit_value: input.km_limit_value,
    created_at: now,
    updated_at: now
  };

  store.bookings.push(booking);

  recordAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "booking.create",
    resourceType: "booking",
    resourceId: booking.id,
    metadata: {
      user_id: user.id,
      vehicle_id: vehicle.id,
      initial_status: booking.status
    }
  });

  return booking;
}

export function extendBooking(
  bookingId: string,
  input: ExtendBookingRequest,
  actor: { userId: string; role: Role }
) {
  const booking = getBookingOrThrow(bookingId);
  const ownerAllowed = actor.role === "customer" && booking.user_id === actor.userId;
  if (!ownerAllowed && actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Not allowed to extend this booking.");
  }

  if (booking.status !== "ongoing" && booking.status !== "extended") {
    throw new ApiException(
      409,
      "invalid_state",
      "Booking can be extended only from ongoing or extended status."
    );
  }

  if (new Date(input.requested_drop_at).getTime() <= new Date(booking.drop_at).getTime()) {
    throw new ApiException(
      400,
      "invalid_extension_time",
      "Extended drop time must be after current drop time."
    );
  }

  if (isVehicleBlockedDuring(booking.vehicle_id, booking.drop_at, input.requested_drop_at)) {
    throw new ApiException(
      409,
      "vehicle_blocked",
      "Vehicle has a block or maintenance window for requested extension."
    );
  }
  if (
    hasVehicleBookingOverlap(
      booking.vehicle_id,
      booking.drop_at,
      input.requested_drop_at,
      booking.id
    )
  ) {
    throw new ApiException(
      409,
      "vehicle_unavailable",
      "Vehicle has another booking in requested extension period."
    );
  }

  assertCanTransition(booking.status, "extension_requested", "booking.extend.request");
  booking.status = "extension_requested";

  const additionalQuote = computePricingQuote({
    user_id: booking.user_id,
    vehicle_id: booking.vehicle_id,
    city: booking.city,
    duration_bucket: input.duration_bucket,
    duration_value: input.duration_value
  });

  const extensionQuote: PricingQuote = {
    ...additionalQuote,
    deposit_amount: 0,
    total_payable: additionalQuote.total_payable - additionalQuote.deposit_amount
  };

  assertCanTransition("extension_requested", "extended", "booking.extend.confirm");
  booking.status = "extended";
  booking.drop_at = input.requested_drop_at;
  booking.quote = {
    ...booking.quote,
    base_amount: booking.quote.base_amount + extensionQuote.base_amount,
    duration_amount: booking.quote.duration_amount + extensionQuote.duration_amount,
    addon_amount: booking.quote.addon_amount + extensionQuote.addon_amount,
    coupon_discount: booking.quote.coupon_discount + extensionQuote.coupon_discount,
    tax_amount: booking.quote.tax_amount + extensionQuote.tax_amount,
    total_payable: booking.quote.total_payable + extensionQuote.total_payable,
    km_included: booking.quote.km_included + extensionQuote.km_included,
    excess_km_rate: booking.quote.excess_km_rate
  };
  booking.updated_at = new Date().toISOString();

  recordAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "booking.extend",
    resourceType: "booking",
    resourceId: booking.id,
    metadata: {
      requested_drop_at: input.requested_drop_at,
      additional_payable: extensionQuote.total_payable
    }
  });

  return {
    booking_id: booking.id,
    status: booking.status,
    additional_quote: extensionQuote
  };
}

export function cancelBooking(
  bookingId: string,
  input: CancelBookingRequest,
  actor: { userId: string; role: Role }
) {
  const booking = getBookingOrThrow(bookingId);
  const ownerAllowed = actor.role === "customer" && booking.user_id === actor.userId;
  if (!ownerAllowed && actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Not allowed to cancel this booking.");
  }

  const cancellableStates = new Set([
    "pending_kyc",
    "payment_pending",
    "confirmed",
    "ongoing",
    "extended"
  ]);
  if (!cancellableStates.has(booking.status)) {
    throw new ApiException(
      409,
      "invalid_state",
      `Cannot cancel booking from status ${booking.status}.`
    );
  }

  assertCanTransition(booking.status, "cancelled", "booking.cancel");
  const breakup = computeCancellationBreakup({
    totalPayable: booking.quote.total_payable,
    pickupAt: booking.pickup_at
  });

  booking.status = "cancelled";
  booking.cancel_reason = input.reason;
  booking.updated_at = new Date().toISOString();

  recordAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    action: "booking.cancel",
    resourceType: "booking",
    resourceId: booking.id,
    metadata: {
      reason: input.reason,
      cancellation_charge: breakup.cancellation_charge,
      refund_amount: breakup.refund_amount
    }
  });

  return {
    booking_id: booking.id,
    status: booking.status,
    cancellation_charge: breakup.cancellation_charge,
    refund_amount: breakup.refund_amount,
    charge_rate: breakup.charge_rate
  };
}

function isVehicleBlockedDuring(
  vehicleId: string,
  windowStart: string,
  windowEnd: string
) {
  const start = new Date(windowStart).getTime();
  const end = new Date(windowEnd).getTime();

  return store.vehicleBlocks.some((block) => {
    if (block.vehicle_id !== vehicleId) return false;
    const blockStart = new Date(block.starts_at).getTime();
    const blockEnd = new Date(block.ends_at).getTime();
    return start < blockEnd && end > blockStart;
  });
}

function hasVehicleBookingOverlap(
  vehicleId: string,
  windowStart: string,
  windowEnd: string,
  ignoreBookingId?: string
) {
  const start = new Date(windowStart).getTime();
  const end = new Date(windowEnd).getTime();
  return store.bookings.some((booking) => {
    if (booking.id === ignoreBookingId) return false;
    if (booking.vehicle_id !== vehicleId) return false;
    if (booking.status === "cancelled" || booking.status === "completed") return false;
    const bookingStart = new Date(booking.pickup_at).getTime();
    const bookingEnd = new Date(booking.drop_at).getTime();
    return start < bookingEnd && end > bookingStart;
  });
}
