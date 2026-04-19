"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  status: string;
  user_id: string;
  vehicle_id: string;
  cancel_reason?: string;
};

type KycItem = {
  user_id: string;
  status: string;
  updated_at: string;
};

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [kycItems, setKycItems] = useState<KycItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      "x-user-id": "admin_001",
      "x-role": "admin"
    }),
    []
  );

  async function refreshAll() {
    setError(null);
    const [bookingsRes, kycRes] = await Promise.all([
      fetch("/api/admin/bookings", { headers }),
      fetch("/api/admin/kyc/manual-review", { headers })
    ]);
    const [bookingsJson, kycJson] = await Promise.all([
      bookingsRes.json(),
      kycRes.json()
    ]);

    if (!bookingsRes.ok || !bookingsJson.ok) {
      setError(bookingsJson?.error?.message ?? "Failed to load bookings");
      return;
    }
    if (!kycRes.ok || !kycJson.ok) {
      setError(kycJson?.error?.message ?? "Failed to load KYC queue");
      return;
    }

    setBookings(bookingsJson.data.bookings);
    setKycItems(kycJson.data.items);
  }

  async function rejectBooking(bookingId: string) {
    setError(null);
    const res = await fetch(`/api/admin/bookings/${bookingId}/reject`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason: "Admin rejected during ops review" })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to reject booking");
      return;
    }
    await refreshAll();
  }

  async function approveKyc(userId: string) {
    const res = await fetch(`/api/admin/kyc/${userId}/approve`, {
      method: "POST",
      headers
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to approve KYC");
      return;
    }
    await refreshAll();
  }

  async function rejectKyc(userId: string) {
    const res = await fetch(`/api/admin/kyc/${userId}/reject`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason: "Document mismatch" })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to reject KYC");
      return;
    }
    await refreshAll();
  }

  useEffect(() => {
    refreshAll().catch((e) => setError(String(e)));
  }, []);

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Booking operations and KYC manual review queue.</p>

      <section className="card">
        <button onClick={() => refreshAll()}>Refresh Admin Data</button>
      </section>

      <section className="card">
        <h3>Bookings</h3>
        {bookings.length === 0 ? <p>No bookings found.</p> : null}
        {bookings.map((booking) => (
          <div className="card" key={booking.id}>
            <div>ID: {booking.id}</div>
            <div>User: {booking.user_id}</div>
            <div>Vehicle: {booking.vehicle_id}</div>
            <div>Status: {booking.status}</div>
            <button onClick={() => rejectBooking(booking.id)}>Reject Booking</button>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>KYC Manual Review Queue</h3>
        {kycItems.length === 0 ? <p>No manual-review items.</p> : null}
        {kycItems.map((item) => (
          <div className="card" key={item.user_id}>
            <div>User: {item.user_id}</div>
            <div>Status: {item.status}</div>
            <button onClick={() => approveKyc(item.user_id)}>Approve</button>{" "}
            <button onClick={() => rejectKyc(item.user_id)}>Reject</button>
          </div>
        ))}
      </section>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
