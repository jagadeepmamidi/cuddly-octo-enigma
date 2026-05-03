import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { processRazorpayWebhook } from "@/lib/payments/service";
import { store } from "@/lib/data/store";

describe("payments service", () => {
  it("marks payment order paid and confirms booking on captured webhook", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
    const bookingId = "booking_payment_webhook_test";
    const orderId = "order_payment_webhook_test";
    const paymentId = "pay_payment_webhook_test";
    const now = new Date().toISOString();

    store.bookings.push({
      id: bookingId,
      user_id: "cust_001",
      vehicle_id: "veh_001",
      city: "bengaluru",
      status: "payment_pending",
      pickup_at: now,
      drop_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      quote: {
        base_amount: 750,
        duration_amount: 0,
        addon_amount: 0,
        coupon_discount: 0,
        deposit_amount: 2000,
        tax_amount: 135,
        total_payable: 2885,
        km_included: 120,
        excess_km_rate: 5
      },
      km_limit_bucket: "day",
      km_limit_value: 120,
      created_at: now,
      updated_at: now
    });
    store.paymentOrders.push({
      id: "pay_order_webhook_test",
      booking_id: bookingId,
      provider: "razorpay",
      provider_order_id: orderId,
      amount: 288500,
      currency: "INR",
      status: "created",
      created_at: now,
      updated_at: now
    });

    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            status: "captured"
          }
        }
      }
    });
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const result = await processRazorpayWebhook({ rawBody, signature });
    const booking = store.bookings.find((item) => item.id === bookingId);
    const paymentOrder = store.paymentOrders.find((item) => item.provider_order_id === orderId);

    expect(result).toEqual({ processed: true, event: "payment.captured" });
    expect(booking?.status).toBe("confirmed");
    expect(paymentOrder?.status).toBe("paid");
    expect(paymentOrder?.provider_payment_id).toBe(paymentId);
  });
});
