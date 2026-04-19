import { store } from "@/lib/data/store";
import type { Booking, KycRecord, User, Vehicle } from "@/lib/types/domain";
import { ApiException } from "@/lib/utils/errors";

export function assertBengaluruCity(city: string) {
  if (city !== "bengaluru") {
    throw new ApiException(
      400,
      "unsupported_city",
      "Phase 1 supports only Bengaluru."
    );
  }
}

export function getUserOrThrow(userId: string): User {
  const user = store.users.find((item) => item.id === userId);
  if (!user) {
    throw new ApiException(404, "user_not_found", "User does not exist.");
  }
  return user;
}

export function getVehicleOrThrow(vehicleId: string): Vehicle {
  const vehicle = store.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    throw new ApiException(404, "vehicle_not_found", "Vehicle does not exist.");
  }
  if (!vehicle.is_active) {
    throw new ApiException(409, "vehicle_inactive", "Vehicle is not active.");
  }
  return vehicle;
}

export function getKycRecordOrThrow(userId: string): KycRecord {
  const kyc = store.kycRecords.find((item) => item.user_id === userId);
  if (!kyc) {
    throw new ApiException(404, "kyc_not_found", "KYC record does not exist.");
  }
  return kyc;
}

export function getBookingOrThrow(bookingId: string): Booking {
  const booking = store.bookings.find((item) => item.id === bookingId);
  if (!booking) {
    throw new ApiException(404, "booking_not_found", "Booking does not exist.");
  }
  return booking;
}

