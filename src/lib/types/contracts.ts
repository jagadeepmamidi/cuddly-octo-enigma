import type { Booking, PricingQuote } from "@/lib/types/domain";

export interface QuoteRequest {
  user_id: string;
  vehicle_id: string;
  city: "bengaluru";
  duration_bucket: "hour" | "day" | "week" | "month";
  duration_value: number;
  extra_helmet_count?: number;
  coupon_code?: string;
}

export interface CreateBookingRequest {
  user_id: string;
  vehicle_id: string;
  city: "bengaluru";
  pickup_at: string;
  drop_at: string;
  duration_bucket: "hour" | "day" | "week" | "month";
  duration_value: number;
  km_limit_bucket: "day" | "week" | "month";
  km_limit_value: number;
  extra_helmet_count?: number;
  coupon_code?: string;
}

export interface CreateBookingResponse {
  booking: Booking;
}

export interface ExtendBookingRequest {
  requested_drop_at: string;
  duration_bucket: "hour" | "day";
  duration_value: number;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface RevenueResponse {
  totals: {
    booking_count: number;
    gross_revenue: number;
    completed_revenue: number;
  };
  booking_wise: Array<{
    booking_id: string;
    vehicle_id: string;
    status: string;
    total_payable: number;
  }>;
  vehicle_wise: Array<{
    vehicle_id: string;
    booking_count: number;
    revenue: number;
  }>;
  period_wise: {
    weekly: Array<{ week: string; revenue: number }>;
    monthly: Array<{ month: string; revenue: number }>;
  };
}

export interface BlockVehicleRequest {
  starts_at: string;
  ends_at: string;
  reason: string;
}

export interface RejectBookingRequest {
  reason: string;
}

export interface KycStartRequest {
  user_id: string;
}

export interface KycCallbackRequest {
  requestId: string;
  status?: "verified" | "failed" | "manual_review";
  aadhaarVerified?: boolean;
  dlVerified?: boolean;
  cibilScore?: number | null;
  failureReason?: string;
}

export interface KycAdminDecisionRequest {
  reason?: string;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ExtensionResponse {
  booking_id: string;
  status: string;
  additional_quote: PricingQuote;
}

export interface CreatePaymentOrderRequest {
  booking_id: string;
}

export interface ReportDamageRequest {
  description: string;
  photo_urls: string[];
}
