# Bengaluru Staging and UAT Checklist

Last updated: April 19, 2026

## 1) Environment Preparation
1. Configure `.env` with:
   - `BETTER_AUTH_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `SETU_CLIENT_ID`
   - `SETU_CLIENT_SECRET`
   - `SETU_PRODUCT_INSTANCE_ID`
   - `SETU_DIGILOCKER_BASE_URL`
   - `SETU_REDIRECT_URL`
   - `JOB_SECRET`
2. Set `ALLOW_DEV_HEADERS=false` in staging.

## 2) Database Setup
1. Run migration:
   - `npm run migrate`
2. Run seed:
   - `npm run seed`
3. Validate RLS:
   - customer reads own bookings only
   - partner reads only owned-vehicle bookings
   - admin has full operational visibility

## 3) Payment Validation
1. Create booking in `payment_pending`.
2. Create Razorpay order via `/api/payments/order`.
3. Trigger webhook test event to `/api/webhooks/razorpay`.
4. Confirm booking moves to `confirmed` on `payment.captured`.

## 4) KYC Validation
1. Start KYC: `/api/kyc/digilocker/start`.
2. Validate callback handling: `/api/kyc/digilocker/callback`.
3. Validate status polling: `/api/kyc/digilocker/status/[requestId]`.
4. Validate admin queue and approve/reject:
   - `/api/admin/kyc/manual-review`
   - `/api/admin/kyc/[userId]/approve`
   - `/api/admin/kyc/[userId]/reject`

## 5) Operational Job Validation
1. Run document expiry job:
   - `npm run job:documents`
2. Run incident escalation job:
   - `npm run job:incidents`
3. Validate notifications queued in `notification_jobs`.

## 6) UI UAT Flows
1. Customer dashboard:
   - Quote -> booking -> list bookings -> damage report.
2. Partner dashboard:
   - Revenue view -> block vehicle window.
3. Admin dashboard:
   - View bookings -> reject booking.
   - View KYC queue -> approve/reject entries.

## 7) Release Sign-Off
1. `npm run typecheck` passes.
2. `npm run test` passes.
3. `npm run build` passes.
4. Business owner confirms payment + KYC credentials are production-approved.
5. Bengaluru UAT approval received before production release.

