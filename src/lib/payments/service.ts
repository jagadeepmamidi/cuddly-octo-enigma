import crypto from "crypto";
import {
  getBookingOrThrow,
  hasProcessedPaymentEvent,
  insertPaymentEvent,
  insertPaymentOrder,
  updateBooking,
  updatePaymentOrderByProviderId
} from "@/lib/data/repository";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/integrations/razorpay";
import { ApiException } from "@/lib/utils/errors";
import { newId } from "@/lib/utils/ids";

export async function createOrderForBooking(bookingId: string) {
  const booking = await getBookingOrThrow(bookingId);
  if (booking.status !== "payment_pending") {
    throw new ApiException(
      409,
      "invalid_booking_status",
      "Payment order can be created only for payment_pending booking."
    );
  }

  const order = await createRazorpayOrder({
    amountInPaise: booking.quote.total_payable * 100,
    receipt: booking.id
  });

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

