# Data Engineering & Machine Learning Contribution Guide

This document outlines the areas where Data Engineering, Machine Learning, and MLOps skills can be applied to the Rbabikerentals platform. The core application is a Next.js monolithic service, but it requires intelligent microservices and robust data pipelines to scale effectively.

---

## 1. Dynamic Pricing Service (Python & ML)

**Objective:** Move from a static, rule-based pricing model to a dynamic, demand-aware pricing engine to optimize revenue and fleet utilization.

### Architecture
- **Service:** A standalone Python microservice built with **FastAPI**.
- **Model:** A regression model (e.g., XGBoost, LightGBM, or a simple Random Forest) that outputs a surge multiplier (e.g., `1.0` for base price, `1.5` for high demand).
- **Deployment:** Containerized via Docker, deployed alongside the Next.js app.

### API Contract (Proposed)
The Next.js app (`/api/quotes`) will call this service when generating a quote.

**Endpoint:** `POST /predict-surge`
**Request Payload:**
```json
{
  "pickup_hub_id": "hub_bengaluru_indiranagar",
  "vehicle_category": "scooter",
  "start_time": "2026-05-04T09:00:00Z",
  "duration_hours": 24,
  "current_hub_inventory": 12,
  "historical_booking_rate_for_hour": 0.8
}
```
**Response Payload:**
```json
{
  "surge_multiplier": 1.25,
  "reason": "high_demand_morning",
  "model_version": "v1.2.0"
}
```

### Next Steps for You:
1. Set up a base FastAPI project structure.
2. Define a synthetic dataset script to simulate historical bookings, weather data, and inventory levels.
3. Train a baseline ML model using Scikit-learn or XGBoost.
4. Wrap the model in the FastAPI endpoint.

---

## 2. ETL Pipelines & Analytics Data Warehouse (Data Engineering)

**Objective:** Offload analytical queries (revenue, utilization, payouts) from the primary transactional database (Supabase/Postgres) to a dedicated analytics layer.

### Architecture
- **Tooling:** Python, **Apache Airflow** (or Mage/Prefect).
- **Source:** Supabase PostgreSQL.
- **Target:** A Data Warehouse (e.g., Google BigQuery, Snowflake, or a separate Postgres analytics schema).

### Pipelines to Build
1. **Booking Fact Table:** Flatten the complex JSON/relational booking data into a star schema for easy dashboarding.
2. **Partner Payout Reconciliation:** An end-of-week pipeline that aggregates `completed` bookings, calculates the platform commission, and generates the final payout amounts per partner.
3. **Vehicle Utilization Metrics:** A daily job that calculates the percentage of time a vehicle was booked versus idle.

### Next Steps for You:
1. Set up a local Airflow environment using Docker Compose.
2. Write a Python DAG to extract yesterday's completed bookings from the Supabase database.
3. Transform the data to calculate the net revenue per partner.
4. Load the results into a CSV or a separate analytics table.

---

## 3. Telemetry & Predictive Maintenance (ML & Data Pipeline)

**Objective:** Use live vehicle tracking data to detect reckless driving and predict maintenance needs.

### Data Source
The Next.js app receives live pings at `/api/internal/tracking/update` containing `latitude`, `longitude`, `speed_kmph`, and `heading_deg`.

### Tasks
1. **Stream Processing:** Set up a lightweight ingestion pipeline (e.g., Kafka or Redis Streams) to process the high-frequency telemetry data outside of the main Next.js API.
2. **Anomaly Detection (Reckless Driving):** Train an unsupervised model (like Isolation Forest) to flag anomalous speed patterns or sudden deceleration.
3. **Predictive Maintenance:** Build a survival analysis or regression model that predicts the "Time to Next Service" based on cumulative distance driven and historical damage reports.

---

## 4. Robust Task Scheduling (MLOps & Python)

**Objective:** Replace simple Node.js cron scripts with a robust task orchestration framework.

### Current State
The project uses `npm run job:documents` and `npm run job:incidents`.

### Tasks
1. Migrate these jobs to **Celery** (with Redis/RabbitMQ) or **Airflow**.
2. Write Python workers that:
   - Query the database for expiring KYC documents or vehicle insurance.
   - Send notification payloads.
   - Implement exponential backoff for failed tasks.
3. Implement monitoring and alerting for task failures.

---

## 5. Trust & Safety / Fraud Risk Scoring (ML)

**Objective:** Automatically flag high-risk bookings for manual admin review.

### Architecture
- **Service:** An endpoint on the Python FastAPI service.
- **Trigger:** Called during the booking creation flow in Next.js.

### Features for the Model
- Time of booking (e.g., late-night bookings are historically higher risk).
- User profile age.
- Distance between the user's current IP location and the pickup hub.
- Previous cancellation history.

### Output
A risk score from 0.0 to 1.0. If the score exceeds a threshold (e.g., > 0.8), the Next.js app will set the `BookingStatus` to `manual_review` instead of `confirmed`.
