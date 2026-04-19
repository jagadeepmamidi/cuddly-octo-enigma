# Rbabikerentals.com (Phase 1 Scaffold)

This repository contains a Bengaluru-only Phase 1 implementation scaffold for:
- Customer booking surface
- Partner/Investor operations
- Admin operations

## Tech Direction
- Next.js (App Router)
- Better Auth boundary (placeholder module included)
- Supabase boundary + schema draft (`db/schema.sql`)
- Razorpay boundary adapter
- Setu DigiLocker boundary adapter

## Quick Start
1. Copy `.env.example` to `.env.local`.
2. Fill required values.
3. Install dependencies:
   - `npm install`
4. Start dev server:
   - `npm run dev`

## Current Auth Model (Scaffold)
Until Better Auth route handlers are fully wired, APIs use request headers:
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

