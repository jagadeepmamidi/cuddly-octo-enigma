import { store } from "@/lib/data/store";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/db/supabase-client";
import type {
  AuditEvent,
  Booking,
  BookingStatus,
  DamageIncident,
  KycRecord,
  NotificationJob,
  PaymentEvent,
  PaymentOrder,
  User,
  Vehicle,
  VehicleBlockWindow,
  VehicleDocument
} from "@/lib/types/domain";
import { ApiException } from "@/lib/utils/errors";

type DataMode = "memory" | "supabase";

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? "supabase" : "memory";
}

export function assertBengaluruCity(city: string) {
  if (city !== "bengaluru") {
    throw new ApiException(
      400,
      "unsupported_city",
      "Phase 1 supports only Bengaluru."
    );
  }
}

export async function getUserOrThrow(userId: string): Promise<User> {
  if (getDataMode() === "memory") {
    const user = store.users.find((item) => item.id === userId);
    if (!user) {
      throw new ApiException(404, "user_not_found", "User does not exist.");
    }
    return user;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  if (!data) throw new ApiException(404, "user_not_found", "User does not exist.");
  return data as User;
}

export async function upsertUser(user: User): Promise<User> {
  if (getDataMode() === "memory") {
    const existingIndex = store.users.findIndex((item) => item.id === user.id);
    if (existingIndex >= 0) {
      store.users[existingIndex] = user;
    } else {
      store.users.push(user);
    }
    return user;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("app_users")
    .upsert(user, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as User;
}

export async function getVehicleOrThrow(vehicleId: string): Promise<Vehicle> {
  if (getDataMode() === "memory") {
    const vehicle = store.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new ApiException(404, "vehicle_not_found", "Vehicle does not exist.");
    }
    if (!vehicle.is_active) {
      throw new ApiException(409, "vehicle_inactive", "Vehicle is not active.");
    }
    return vehicle;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  if (!data) throw new ApiException(404, "vehicle_not_found", "Vehicle does not exist.");
  if (!data.is_active) {
    throw new ApiException(409, "vehicle_inactive", "Vehicle is not active.");
  }
  return data as Vehicle;
}

export async function listVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
  if (getDataMode() === "memory") {
    return store.vehicles.filter((item) => item.owner_id === ownerId);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", ownerId);
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as Vehicle[];
}

export async function listVehicles(): Promise<Vehicle[]> {
  if (getDataMode() === "memory") {
    return store.vehicles;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("vehicles").select("*");
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as Vehicle[];
}

export async function upsertVehicle(vehicle: Vehicle): Promise<Vehicle> {
  if (getDataMode() === "memory") {
    const existingIndex = store.vehicles.findIndex((item) => item.id === vehicle.id);
    if (existingIndex >= 0) {
      store.vehicles[existingIndex] = vehicle;
    } else {
      store.vehicles.push(vehicle);
    }
    return vehicle;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicles")
    .upsert(vehicle, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as Vehicle;
}

export async function getKycRecordOrThrow(userId: string): Promise<KycRecord> {
  if (getDataMode() === "memory") {
    const kyc = store.kycRecords.find((item) => item.user_id === userId);
    if (!kyc) {
      throw new ApiException(404, "kyc_not_found", "KYC record does not exist.");
    }
    return kyc;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("kyc_records")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  if (!data) throw new ApiException(404, "kyc_not_found", "KYC record does not exist.");
  return data as KycRecord;
}

export async function getKycByRequestId(requestId: string): Promise<KycRecord | null> {
  if (getDataMode() === "memory") {
    return store.kycRecords.find((item) => item.request_id === requestId) ?? null;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("kyc_records")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data as KycRecord | null) ?? null;
}

export async function upsertKycRecord(kyc: KycRecord): Promise<KycRecord> {
  if (getDataMode() === "memory") {
    const existingIndex = store.kycRecords.findIndex((item) => item.user_id === kyc.user_id);
    if (existingIndex >= 0) {
      store.kycRecords[existingIndex] = kyc;
    } else {
      store.kycRecords.push(kyc);
    }
    return kyc;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("kyc_records")
    .upsert(kyc, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as KycRecord;
}

export async function listManualReviewKyc(): Promise<KycRecord[]> {
  if (getDataMode() === "memory") {
    return store.kycRecords.filter((item) => item.status === "manual_review");
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("kyc_records")
    .select("*")
    .eq("status", "manual_review");
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as KycRecord[];
}

export async function getBookingOrThrow(bookingId: string): Promise<Booking> {
  if (getDataMode() === "memory") {
    const booking = store.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      throw new ApiException(404, "booking_not_found", "Booking does not exist.");
    }
    return booking;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  if (!data) throw new ApiException(404, "booking_not_found", "Booking does not exist.");
  return data as Booking;
}

export async function insertBooking(booking: Booking): Promise<Booking> {
  if (getDataMode() === "memory") {
    store.bookings.push(booking);
    return booking;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as Booking;
}

export async function updateBooking(
  bookingId: string,
  patch: Partial<Booking>
): Promise<Booking> {
  if (getDataMode() === "memory") {
    const index = store.bookings.findIndex((item) => item.id === bookingId);
    if (index < 0) {
      throw new ApiException(404, "booking_not_found", "Booking does not exist.");
    }
    const updated = { ...store.bookings[index], ...patch };
    store.bookings[index] = updated;
    return updated;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as Booking;
}

export async function listBookings(filter?: {
  status?: string;
  userId?: string;
  vehicleId?: string;
  excludeStatuses?: BookingStatus[];
}): Promise<Booking[]> {
  if (getDataMode() === "memory") {
    return store.bookings.filter((item) => {
      if (filter?.status && item.status !== filter.status) return false;
      if (filter?.userId && item.user_id !== filter.userId) return false;
      if (filter?.vehicleId && item.vehicle_id !== filter.vehicleId) return false;
      if (filter?.excludeStatuses?.includes(item.status)) return false;
      return true;
    });
  }

  const supabase = getSupabaseServiceClient();
  let query = supabase.from("bookings").select("*");
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  if (filter?.vehicleId) query = query.eq("vehicle_id", filter.vehicleId);
  if (filter?.excludeStatuses?.length) {
    query = query.not("status", "in", `(${filter.excludeStatuses.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as Booking[];
}

export async function insertVehicleBlock(blockWindow: VehicleBlockWindow): Promise<VehicleBlockWindow> {
  if (getDataMode() === "memory") {
    store.vehicleBlocks.push(blockWindow);
    return blockWindow;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicle_block_windows")
    .insert(blockWindow)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as VehicleBlockWindow;
}

export async function listVehicleBlocks(vehicleId: string): Promise<VehicleBlockWindow[]> {
  if (getDataMode() === "memory") {
    return store.vehicleBlocks.filter((item) => item.vehicle_id === vehicleId);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicle_block_windows")
    .select("*")
    .eq("vehicle_id", vehicleId);
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as VehicleBlockWindow[];
}

export async function insertAuditEvent(event: AuditEvent): Promise<void> {
  if (getDataMode() === "memory") {
    store.auditEvents.push(event);
    return;
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("audit_events").insert(event);
  if (error) throw new ApiException(500, "db_error", error.message);
}

export async function insertPaymentOrder(order: PaymentOrder): Promise<PaymentOrder> {
  if (getDataMode() === "memory") {
    store.paymentOrders.push(order);
    return order;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .insert(order)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as PaymentOrder;
}

export async function updatePaymentOrderByProviderId(
  providerOrderId: string,
  patch: Partial<PaymentOrder>
): Promise<PaymentOrder | null> {
  if (getDataMode() === "memory") {
    const idx = store.paymentOrders.findIndex(
      (item) => item.provider_order_id === providerOrderId
    );
    if (idx < 0) return null;
    store.paymentOrders[idx] = { ...store.paymentOrders[idx], ...patch };
    return store.paymentOrders[idx];
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .update(patch)
    .eq("provider_order_id", providerOrderId)
    .select("*")
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data as PaymentOrder | null) ?? null;
}

export async function hasProcessedPaymentEvent(providerEventId: string): Promise<boolean> {
  if (getDataMode() === "memory") {
    return store.paymentEvents.some((item) => item.provider_event_id === providerEventId);
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_events")
    .select("id")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();
  if (error) throw new ApiException(500, "db_error", error.message);
  return Boolean(data);
}

export async function insertPaymentEvent(event: PaymentEvent): Promise<void> {
  if (getDataMode() === "memory") {
    store.paymentEvents.push(event);
    return;
  }
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("payment_events").insert(event);
  if (error) throw new ApiException(500, "db_error", error.message);
}

export async function insertDamageIncident(incident: DamageIncident): Promise<DamageIncident> {
  if (getDataMode() === "memory") {
    store.damageIncidents.push(incident);
    return incident;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("damage_incidents")
    .insert(incident)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as DamageIncident;
}

export async function listOpenDamageIncidents(): Promise<DamageIncident[]> {
  if (getDataMode() === "memory") {
    return store.damageIncidents;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("damage_incidents").select("*");
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as DamageIncident[];
}

export async function insertVehicleDocument(doc: VehicleDocument): Promise<VehicleDocument> {
  if (getDataMode() === "memory") {
    store.vehicleDocuments.push(doc);
    return doc;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .insert(doc)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as VehicleDocument;
}

export async function listVehicleDocumentsExpiringBefore(
  isoTime: string
): Promise<VehicleDocument[]> {
  if (getDataMode() === "memory") {
    return store.vehicleDocuments.filter((item) => item.expires_at <= isoTime);
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select("*")
    .lte("expires_at", isoTime);
  if (error) throw new ApiException(500, "db_error", error.message);
  return (data ?? []) as VehicleDocument[];
}

export async function insertNotificationJob(job: NotificationJob): Promise<NotificationJob> {
  if (getDataMode() === "memory") {
    store.notificationJobs.push(job);
    return job;
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("notification_jobs")
    .insert(job)
    .select("*")
    .single();
  if (error) throw new ApiException(500, "db_error", error.message);
  return data as NotificationJob;
}
