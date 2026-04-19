import crypto from "crypto";
import {
  getBookingOrThrow,
  getOpenPaymentOrderForBooking,
  hasProcessedPaymentEvent,
  insertPaymentEvent,
  insertPaymentOrder,
  updateBooking,
  updatePaymentOrderByProviderId
} from "@/lib/data/repository";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/integrations/razorpay";
import type { Role } from "@/lib/types/domain";
import { ApiException } from "@/lib/utils/errors";
import { newId } from "@/lib/utils/ids";

function toClientOrder(params: {
  bookingId: string;
  providerOrderId: string;
  amount: number;
  currency: "INR";
  status: string;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new ApiException(500, "razorpay_env_missing", "Razorpay keys are not configured.");
  }

  return {
    provider: "razorpay" as const,
    key_id: keyId,
    order_id: params.providerOrderId,
    amount: params.amount,
    currency: params.currency,
    receipt: params.bookingId,
    status: params.status
  };
}

export async function createOrderForBooking(
  bookingId: string,
  actor: { userId: string; role: Role }
) {
  const booking = await getBookingOrThrow(bookingId);
  const ownerAllowed = actor.role === "customer" && booking.user_id === actor.userId;
  if (!ownerAllowed && actor.role !== "admin") {
    throw new ApiException(403, "forbidden", "Not allowed to create a payment order for this booking.");
  }
  if (booking.status !== "payment_pending") {
    throw new ApiException(
      409,
      "invalid_booking_status",
      "Payment order can be created only for payment_pending booking."
    );
  }

  const existingOrder = await getOpenPaymentOrderForBooking(bookingId);
  if (existingOrder) {
    return toClientOrder({
      bookingId,
      providerOrderId: existingOrder.provider_order_id,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      status: existingOrder.status
    });
  }

  const order = await createRazorpayOrder({
    amountInPaise: booking.quote.total_payable * 100,
    receipt: booking.id
  });

  try {
    await insertPaymentOrder({
      id: newId("pay_order"),
      booking_id: booking.id,
      provider: "razorpay",
      provider_order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof ApiException && error.code === "payment_order_exists") {
      const openOrder = await getOpenPaymentOrderForBooking(bookingId);
      if (openOrder) {
        return toClientOrder({
          bookingId,
          providerOrderId: openOrder.provider_order_id,
          amount: openOrder.amount,
          currency: openOrder.currency,
          status: openOrder.status
        });
      }
    }
    throw error;
  }

  return order;
}

export async function processRazorpayWebhook(params: {
  signature: string | null;
  rawBody: string;
}) {
  if (!params.signature) {
    throw new ApiException(400, "signature_missing", "Missing Razorpay signature.");
  }
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiException(
      500,
      "razorpay_webhook_secret_missing",
      "RAZORPAY_WEBHOOK_SECRET is missing."
    );
  }

  const expected = crypto.createHmac("sha256", secret).update(params.rawBody).digest("hex");
  if (expected !== params.signature) {
    throw new ApiException(401, "invalid_signature", "Invalid Razorpay webhook signature.");
  }

  const payload = JSON.parse(params.rawBody) as {
    event: string;
    created_at?: number;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  const eventId = `${payload.event}:${payload.payload?.payment?.entity?.id ?? "unknown"}`;
  if (await hasProcessedPaymentEvent(eventId)) {
    return { processed: false, reason: "duplicate_event" };
  }

  await insertPaymentEvent({
    id: newId("pay_evt"),
    provider: "razorpay",
    provider_event_id: eventId,
    payload_hash: crypto.createHash("sha256").update(params.rawBody).digest("hex"),
    created_at: new Date().toISOString()
  });

  if (payload.event === "payment.captured") {
    const orderId = payload.payload?.payment?.entity?.order_id;
    if (orderId) {
      const updatedOrder = await updatePaymentOrderByProviderId(orderId, {
        status: "paid",
        updated_at: new Date().toISOString()
      });

      if (updatedOrder) {
        await updateBooking(updatedOrder.booking_id, {
          status: "confirmed",
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  if (payload.event === "payment.failed") {
    const orderId = payload.payload?.payment?.entity?.order_id;
    if (orderId) {
      await updatePaymentOrderByProviderId(orderId, {
        status: "failed",
        updated_at: new Date().toISOString()
      });
    }
  }

  return { processed: true, event: payload.event };
}

export function verifyClientPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const valid = verifyRazorpaySignature(input);
  if (!valid) {
    throw new ApiException(400, "invalid_signature", "Client payment signature mismatch.");
  }
  return { verified: true };
}
