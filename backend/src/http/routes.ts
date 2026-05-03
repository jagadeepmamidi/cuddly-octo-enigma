import type { Express } from "express";
import { adaptRoute } from "./adapter";

import * as adminBookings from "../api/admin/bookings/route";
import * as adminBookingReject from "../api/admin/bookings/[id]/reject/route";
import * as adminKycApprove from "../api/admin/kyc/[userId]/approve/route";
import * as adminKycManualReview from "../api/admin/kyc/manual-review/route";
import * as adminKycReject from "../api/admin/kyc/[userId]/reject/route";
import * as adminTracking from "../api/admin/tracking/route";
import * as adminVehicleImages from "../api/admin/vehicles/[id]/images/route";
import * as adminVehicleById from "../api/admin/vehicles/[id]/route";
import * as adminVehicles from "../api/admin/vehicles/route";
import * as bookingCancel from "../api/bookings/[id]/cancel/route";
import * as bookingDamage from "../api/bookings/[id]/damage/route";
import * as bookingExtend from "../api/bookings/[id]/extend/route";
import * as bookings from "../api/bookings/route";
import * as customerBookings from "../api/customer/bookings/route";
import * as documentExpiryJob from "../api/internal/jobs/document-expiry/route";
import * as incidentEscalationJob from "../api/internal/jobs/incident-escalation/route";
import * as trackingUpdate from "../api/internal/tracking/update/route";
import * as kycByUser from "../api/kyc/[userId]/route";
import * as digilockerCallback from "../api/kyc/digilocker/callback/route";
import * as digilockerStart from "../api/kyc/digilocker/start/route";
import * as digilockerStatus from "../api/kyc/digilocker/status/[requestId]/route";
import * as mapsDistance from "../api/maps/distance/route";
import * as mapsReverseGeocode from "../api/maps/reverse-geocode/route";
import * as partnerRevenue from "../api/partner/revenue/route";
import * as partnerTracking from "../api/partner/tracking/route";
import * as paymentOrder from "../api/payments/order/route";
import * as paymentRefund from "../api/payments/refund/route";
import * as quotes from "../api/quotes/route";
import * as vehicleBlock from "../api/vehicles/[id]/block/route";
import * as razorpayWebhook from "../api/webhooks/razorpay/route";

export function registerApiRoutes(app: Express) {
  app.post("/api/quotes", adaptRoute(quotes));
  app.post("/api/bookings", adaptRoute(bookings));
  app.post("/api/bookings/:id/extend", adaptRoute(bookingExtend));
  app.post("/api/bookings/:id/cancel", adaptRoute(bookingCancel));
  app.post("/api/bookings/:id/damage", adaptRoute(bookingDamage));
  app.get("/api/customer/bookings", adaptRoute(customerBookings));

  app.post("/api/kyc/digilocker/start", adaptRoute(digilockerStart));
  app.post("/api/kyc/digilocker/callback", adaptRoute(digilockerCallback));
  app.get("/api/kyc/digilocker/status/:requestId", adaptRoute(digilockerStatus));
  app.get("/api/kyc/:userId", adaptRoute(kycByUser));

  app.post("/api/payments/order", adaptRoute(paymentOrder));
  app.post("/api/payments/refund", adaptRoute(paymentRefund));
  app.post("/api/webhooks/razorpay", adaptRoute(razorpayWebhook));

  app.post("/api/maps/reverse-geocode", adaptRoute(mapsReverseGeocode));
  app.post("/api/maps/distance", adaptRoute(mapsDistance));

  app.get("/api/partner/revenue", adaptRoute(partnerRevenue));
  app.get("/api/partner/tracking", adaptRoute(partnerTracking));
  app.post("/api/vehicles/:id/block", adaptRoute(vehicleBlock));

  app.get("/api/admin/bookings", adaptRoute(adminBookings));
  app.post("/api/admin/bookings/:id/reject", adaptRoute(adminBookingReject));
  app.get("/api/admin/vehicles", adaptRoute(adminVehicles));
  app.post("/api/admin/vehicles", adaptRoute(adminVehicles));
  app.patch("/api/admin/vehicles/:id", adaptRoute(adminVehicleById));
  app.delete("/api/admin/vehicles/:id", adaptRoute(adminVehicleById));
  app.post("/api/admin/vehicles/:id/images", adaptRoute(adminVehicleImages));
  app.get("/api/admin/tracking", adaptRoute(adminTracking));
  app.get("/api/admin/kyc/manual-review", adaptRoute(adminKycManualReview));
  app.post("/api/admin/kyc/:userId/approve", adaptRoute(adminKycApprove));
  app.post("/api/admin/kyc/:userId/reject", adaptRoute(adminKycReject));

  app.post("/api/internal/tracking/update", adaptRoute(trackingUpdate));
  app.post("/api/internal/jobs/document-expiry", adaptRoute(documentExpiryJob));
  app.post("/api/internal/jobs/incident-escalation", adaptRoute(incidentEscalationJob));
}
