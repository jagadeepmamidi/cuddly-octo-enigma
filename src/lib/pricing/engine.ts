import { getVehicleOrThrow } from "@/lib/data/repository";
import type { PricingQuote } from "@/lib/types/domain";
import type { QuoteRequest } from "@/lib/types/contracts";

const GST_RATE = 0.18;
const HELMET_RATE = {
  hour: 20,
  day: 80,
  week: 420,
  month: 1400
} as const;

const couponRules: Record<string, number> = {
  WELCOME5: 0.05,
  BENGALURU10: 0.1,
  WEEKEND15: 0.15
};

export function computePricingQuote(input: QuoteRequest): PricingQuote {
  const vehicle = getVehicleOrThrow(input.vehicle_id);
  const bucket = input.duration_bucket;
  const count = input.duration_value;

  let baseRate = 0;
  if (bucket === "hour") baseRate = vehicle.rate_per_hour;
  if (bucket === "day") baseRate = vehicle.rate_per_day;
  if (bucket === "week") baseRate = vehicle.rate_per_week;
  if (bucket === "month") baseRate = vehicle.rate_per_month;

  const baseAmount = baseRate * count;
  const durationAmount = 0;
  const addonAmount =
    (input.extra_helmet_count ?? 0) * HELMET_RATE[bucket] * count;
  const discountRate = input.coupon_code ? couponRules[input.coupon_code] ?? 0 : 0;
  const couponDiscount = Math.round((baseAmount + addonAmount) * discountRate);
  const depositAmount = vehicle.deposit_amount;
  const taxable = Math.max(0, baseAmount + durationAmount + addonAmount - couponDiscount);
  const taxAmount = Math.round(taxable * GST_RATE);
  const totalPayable = taxable + taxAmount + depositAmount;
  const kmIncluded = estimateKmIncluded(bucket, count);
  const excessKmRate = excessKmRateByCategory(vehicle.category);

  return {
    base_amount: baseAmount,
    duration_amount: durationAmount,
    addon_amount: addonAmount,
    coupon_discount: couponDiscount,
    deposit_amount: depositAmount,
    tax_amount: taxAmount,
    total_payable: totalPayable,
    km_included: kmIncluded,
    excess_km_rate: excessKmRate
  };
}

function estimateKmIncluded(
  bucket: "hour" | "day" | "week" | "month",
  count: number
) {
  if (bucket === "hour") return 10 * count;
  if (bucket === "day") return 120 * count;
  if (bucket === "week") return 900 * count;
  return 3000 * count;
}

function excessKmRateByCategory(category: "scooter" | "bike" | "ev_bike") {
  if (category === "scooter") return 5;
  if (category === "bike") return 7;
  return 6;
}

export function computeCancellationBreakup(params: {
  totalPayable: number;
  pickupAt: string;
}) {
  const now = Date.now();
  const pickup = new Date(params.pickupAt).getTime();
  const hoursToPickup = (pickup - now) / (1000 * 60 * 60);
  const chargeRate = hoursToPickup >= 24 ? 0.1 : 0.3;
  const cancellationCharge = Math.round(params.totalPayable * chargeRate);
  const refundAmount = Math.max(0, params.totalPayable - cancellationCharge);

  return {
    charge_rate: chargeRate,
    cancellation_charge: cancellationCharge,
    refund_amount: refundAmount
  };
}

