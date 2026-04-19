export type Role = "customer" | "partner_investor" | "admin";

export type KycStatus =
  | "not_started"
  | "in_progress"
  | "verified"
  | "manual_review"
  | "failed"
  | "expired";

export type BookingStatus =
  | "draft"
  | "pending_kyc"
  | "payment_pending"
  | "confirmed"
  | "ongoing"
  | "extension_requested"
  | "extended"
  | "completed"
  | "cancelled";

export interface PricingQuote {
  base_amount: number;
  duration_amount: number;
  addon_amount: number;
  coupon_discount: number;
  deposit_amount: number;
  tax_amount: number;
  total_payable: number;
  km_included: number;
  excess_km_rate: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  city: "bengaluru";
  kyc_status: KycStatus;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  city: "bengaluru";
  category: "scooter" | "bike" | "ev_bike";
  brand: string;
  model: string;
  is_active: boolean;
  deposit_amount: number;
  rate_per_hour: number;
  rate_per_day: number;
  rate_per_week: number;
  rate_per_month: number;
}

export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string;
  city: "bengaluru";
  status: BookingStatus;
  pickup_at: string;
  drop_at: string;
  quote: PricingQuote;
  coupon_code?: string;
  km_limit_bucket: "day" | "week" | "month";
  km_limit_value: number;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingExtension {
  booking_id: string;
  requested_drop_at: string;
  additional_quote: PricingQuote;
}

export interface VehicleBlockWindow {
  id: string;
  vehicle_id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface DamageIncident {
  id: string;
  booking_id: string;
  vehicle_id: string;
  reported_by: string;
  description: string;
  photo_urls: string[];
  created_at: string;
}

export interface KycRecord {
  user_id: string;
  status: KycStatus;
  provider: "setu_digilocker";
  request_id?: string;
  aadhaar_verified: boolean;
  dl_verified: boolean;
  needs_manual_review: boolean;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_role: Role;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

