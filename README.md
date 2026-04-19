# Rbabikerentals.com (Phase 1 Scaffold)

This repository contains a Bengaluru-only Phase 1 implementation scaffold for:
- Customer booking surface
- Partner/Investor operations
- Admin operations

## Tech Direction
- Next.js (App Router)
- Better Auth session integration (`/api/auth/[...all]`)
- Supabase repository support + schema (`db/schema.sql`)
- Razorpay order + webhook flow
- Setu DigiLocker start/callback/status flow

## Quick Start
1. Copy `.env.example` to `.env.local`.
2. Fill required values.
3. Install dependencies:
   - `npm install`
4. Start dev server:
   - `npm run dev`

## Current Auth Model (Scaffold)
Better Auth is wired. For local development without full auth bootstrap,
set `ALLOW_DEV_HEADERS=true` and use request headers:
- `x-user-id`
- `x-role` (`customer`, `partner_investor`, `admin`)

## Implemented APIs
- `POST /api/quotes`
- `POST /api/bookings`
- `POST /api/bookings/[id]/extend`
- `POST /api/bookings/[id]/cancel`
- `POST /api/kyc/digilocker/start`
- `GET /api/kyc/[userId]`
- `GET /api/partner/revenue`
- `POST /api/vehicles/[id]/block`
- `GET /api/admin/bookings`
- `POST /api/admin/bookings/[id]/reject`
- `POST /api/payments/order`
- `POST /api/webhooks/razorpay`
- `POST /api/kyc/digilocker/callback`
- `GET /api/kyc/digilocker/status/[requestId]`
- `GET /api/admin/kyc/manual-review`
- `POST /api/admin/kyc/[userId]/approve`
- `POST /api/admin/kyc/[userId]/reject`
- `GET /api/customer/bookings`
- `POST /api/bookings/[id]/damage`
- `POST /api/internal/jobs/document-expiry`
- `POST /api/internal/jobs/incident-escalation`

## Database and Jobs
- Run migration: `npm run migrate`
- Seed data: `npm run seed`
- Run document expiry job: `npm run job:documents`
- Run incident escalation job: `npm run job:incidents`

## Example cURL
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "content-type: application/json" \
  -H "x-user-id: cust_001" \
  -H "x-role: customer" \
  -d '{
    "user_id":"cust_001",
    "vehicle_id":"veh_001",
    "city":"bengaluru",
    "duration_bucket":"day",
    "duration_value":1,
    "extra_helmet_count":1,
    "coupon_code":"WELCOME5"
  }'
```

## Important Docs
- `docs/PRD.md`
- `docs/TECH_STACK.md`
- `docs/BACKEND_ARCHITECTURE.md`
- `docs/PHASE1_IMPLEMENTATION_STATUS.md`
- `docs/BUSINESS_OWNER_ACCOUNT_SETUP.md`
- `docs/STAGING_UAT_CHECKLIST.md`
