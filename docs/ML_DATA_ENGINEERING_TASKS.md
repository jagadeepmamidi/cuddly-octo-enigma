# Data Engineering and Machine Learning Contribution Guide

This document outlines practical Data Engineering, Machine Learning, and MLOps contribution areas for the Rbabikerentals platform.

The current Phase 1 application is not a Next.js monolith. It is a monorepo with:
- `frontend/`: React + Vite web app.
- `backend/`: Node.js + Express API boundary.
- Supabase/Postgres as the operational data store.
- TypeScript domain services for pricing, bookings, KYC, tracking, payments, partner revenue, jobs, and admin operations.

The recommendations below are ordered by project fit. Near-term work should improve observability, analytics, scheduling, and data foundations before introducing heavier ML services.

---

## 1. Analytics and Partner Payout Data Layer

**Recommendation:** Valid and high priority.

**Objective:** Move reporting and payout calculations away from ad hoc transactional reads and into a repeatable analytics layer.

### Current Fit
- Partner revenue aggregation already exists in the backend service layer.
- Production hardening notes already call out payout reconciliation and booking/payment reconciliation gaps.
- Supabase/Postgres is the operational source of truth.

### Suggested First Step
Start with a Postgres analytics schema, materialized views, or scheduled CSV exports before adopting a full warehouse.

### Data Models to Build
1. **Booking fact table**
   - One row per booking.
   - Include vehicle, partner, customer, city, booking status, pickup/drop timestamps, quote amounts, payment status, and cancellation metadata.
2. **Partner payout view**
   - Aggregate completed bookings.
   - Calculate gross revenue, platform commission, refunds, deductions, and net payable.
3. **Vehicle utilization view**
   - Calculate booked time versus idle time per vehicle and per period.

### Recommended Tooling
- Near term: Supabase SQL, scheduled backend job, CSV export, or materialized views.
- Later: BigQuery, Snowflake, or a separate analytics Postgres database if dashboards and historical volume justify it.
- Avoid starting with Airflow unless there are multiple cross-system pipelines to orchestrate.

---

## 2. Robust Operational Job Scheduling

**Recommendation:** Valid, but keep the first implementation lightweight.

**Objective:** Make document expiry, incident escalation, and reconciliation jobs reliable in staging and production.

### Current Fit
The project already defines:
- `npm run job:documents`
- `npm run job:incidents`
- Internal API routes for document expiry and incident escalation jobs.

### Suggested First Step
Keep the existing Node/TypeScript job implementations and wire them to a production scheduled runner.

### Tasks
1. Add a scheduled runner for:
   - document expiry reminders
   - incident escalation
   - payment reconciliation
   - partner payout export
2. Add idempotency keys or dedupe checks so repeated job runs do not duplicate notifications or payout rows.
3. Store job run history with:
   - job name
   - started_at
   - finished_at
   - status
   - scanned count
   - affected count
   - error details
4. Add alerts for failed or stale jobs.

### Later Option
Celery, Airflow, or Prefect can be useful after job volume grows or after Python ML pipelines become part of production. They are probably premature for the current Phase 1 codebase.

---

## 3. Telemetry History and Maintenance Signals

**Recommendation:** Partly valid, but data capture must come before ML.

**Objective:** Preserve useful vehicle telemetry so the platform can later support utilization analytics, reckless-driving flags, and maintenance predictions.

### Current Fit
The backend already accepts live pings at:
- `POST /api/internal/tracking/update`

The current payload supports:
- `vehicle_id`
- `latitude`
- `longitude`
- `speed_kmph`
- `heading_deg`
- `source`

### Gap
The current model is focused on latest live location. Predictive maintenance and anomaly detection require historical telemetry events.

### Suggested First Step
Add an append-only `vehicle_telemetry_events` table or equivalent storage before adding stream processing.

Suggested fields:
- `id`
- `vehicle_id`
- `latitude`
- `longitude`
- `speed_kmph`
- `heading_deg`
- `source`
- `recorded_at`
- `received_at`
- optional derived distance fields

### Tasks
1. Store telemetry history alongside the latest location upsert.
2. Add retention rules so high-frequency tracking data does not grow forever.
3. Derive daily distance and utilization summaries.
4. Use rule-based thresholds first for speeding, impossible jumps, and stale device pings.
5. Move to anomaly detection only after enough real telemetry is collected.

### Later Option
Redis Streams, Kafka, or a dedicated telemetry service can be considered if ping volume becomes too high for the Express API and Postgres path.

---

## 4. Dynamic Pricing and Demand-Aware Multipliers

**Recommendation:** Valid as a Phase 2 roadmap item, not a first ML task.

**Objective:** Extend the current rule-based pricing engine with demand-aware multipliers while preserving quote explainability and auditability.

### Current Fit
Pricing is currently implemented in the backend TypeScript pricing engine. It computes duration, add-ons, coupon discount, tax, deposit, included kilometers, and excess-kilometer rate.

### Suggested First Step
Add a rule-based multiplier layer before introducing an ML service.

Example multiplier inputs:
- pickup city or hub
- vehicle category
- start time and day of week
- duration bucket
- current inventory availability
- recent booking rate
- active promotions

### API Shape
If a separate service is added later, the backend should call it from the pricing engine or quote flow, not from the frontend.

Example response:

```json
{
  "surge_multiplier": 1.15,
  "reason": "low_inventory_peak_hour",
  "model_version": "rules-v1"
}
```

### ML Later
A Python FastAPI service with scikit-learn, XGBoost, LightGBM, or Random Forest can be useful after there is enough historical booking and inventory data. Until then, synthetic data should be used only for prototyping and test harnesses, not production decisioning.

---

## 5. Trust and Safety Risk Scoring

**Recommendation:** Conceptually valid, but the original status proposal needs correction.

**Objective:** Help admins identify bookings or users that deserve manual review before pickup or payment confirmation.

### Current Fit
The project already supports KYC `manual_review`, admin KYC actions, booking state transitions, and audit logging.

### Important Correction
`manual_review` is currently a `KycStatus`, not a `BookingStatus`. A booking risk feature should not set `BookingStatus` to `manual_review` unless the booking state machine is explicitly changed.

### Suggested First Step
Add risk metadata to bookings instead of changing booking status immediately.

Possible fields:
- `risk_score`
- `risk_reason_codes`
- `risk_review_required`
- `risk_reviewed_by`
- `risk_reviewed_at`

### Initial Rule-Based Signals
- KYC status.
- New user profile age.
- Previous cancellation count.
- Pickup time risk window.
- Repeated failed payment attempts.
- Mismatch between city, pickup hub, and user-provided location signals.

### ML Later
Add an ML score only after historical fraud, cancellation, damage, and payment outcome labels exist. Start with explainable rules so admins can understand why a booking was flagged.

---

## Recommended Implementation Order

1. Add analytics schema or materialized views for bookings, payouts, and vehicle utilization.
2. Add job run history, idempotency, and production scheduling for operational jobs.
3. Add telemetry event history and retention policy.
4. Add rule-based risk scoring metadata for bookings.
5. Add rule-based pricing multipliers.
6. Revisit Python ML services only after enough production data exists.

## Summary

The ideas are directionally useful, but the project should not jump straight into FastAPI ML microservices, Airflow, Kafka, or Celery. The better path is to strengthen the data foundation first, keep Phase 1 operations simple, and preserve clear backend ownership in the existing Node/Express service layer.
