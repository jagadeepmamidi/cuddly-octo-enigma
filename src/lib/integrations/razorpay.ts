import crypto from "crypto";
import { ApiException } from "@/lib/utils/errors";

export async function createRazorpayOrder(params: {
  amountInPaise: number;
  currency?: "INR";
  receipt: string;
}): Promise<{
  provider: "razorpay";
  key_id: string;
  order_id: string;
  amount: number;
  currency: "INR";
  receipt: string;
  status: string;
}> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiException(
      500,
      "razorpay_env_missing",
      "Razorpay keys are not configured."
    );
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: {
        platform: "rbabikerentals"
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiException(502, "razorpay_order_create_failed", text);
  }

  const order = (await response.json()) as {
    id: string;
    amount: number;
    currency: "INR";
    receipt: string;
    status: string;
  };

  return {
    provider: "razorpay" as const,
    key_id: keyId,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status
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
