import crypto from "crypto";
import { ApiException } from "@/lib/utils/errors";

export function createRazorpayOrder(params: {
  amountInPaise: number;
  currency?: "INR";
  receipt: string;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiException(
      500,
      "razorpay_env_missing",
      "Razorpay keys are not configured."
    );
  }

  // Integration boundary:
  // Replace with live Razorpay Orders API call.
  return {
    provider: "razorpay",
    key_id: keyId,
    order_id: `order_${crypto.randomUUID().slice(0, 12)}`,
    amount: params.amountInPaise,
    currency: params.currency ?? "INR",
    receipt: params.receipt,
    status: "created"
  };
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new ApiException(
      500,
      "razorpay_env_missing",
      "Razorpay webhook secret is not configured."
    );
  }
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return digest === params.signature;
}

