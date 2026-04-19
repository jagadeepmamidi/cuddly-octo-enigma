"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  status: string;
  vehicle_id: string;
  pickup_at: string;
  drop_at: string;
  quote: { total_payable: number };
};

export default function CustomerDashboardPage() {
  const [userId, setUserId] = useState("cust_001");
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      "x-user-id": userId,
      "x-role": "customer"
    }),
    [userId]
  );

  async function loadBookings() {
    setError(null);
    const res = await fetch("/api/customer/bookings", { headers });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to fetch bookings");
      return;
    }
    setBookings(json.data.bookings);
  }

  useEffect(() => {
    loadBookings().catch((e) => setError(String(e)));
  }, [userId]);

  async function requestQuote() {
    setError(null);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        vehicle_id: "veh_001",
        city: "bengaluru",
        duration_bucket: "day",
        duration_value: 1,
        extra_helmet_count: 1,
        coupon_code: "WELCOME5"
      })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to generate quote");
      return;
    }
    setQuote(json.data);
  }

  async function createBooking() {
    setError(null);
    const now = Date.now();
    const pickup = new Date(now + 60 * 60 * 1000).toISOString();
    const drop = new Date(now + 25 * 60 * 60 * 1000).toISOString();

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        vehicle_id: "veh_001",
        city: "bengaluru",
        pickup_at: pickup,
        drop_at: drop,
        duration_bucket: "day",
        duration_value: 1,
        km_limit_bucket: "day",
        km_limit_value: 120,
        extra_helmet_count: 1,
        coupon_code: "WELCOME5"
      })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to create booking");
      return;
    }
    await loadBookings();
  }

  async function reportDamage(bookingId: string) {
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/damage`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        description: "Minor scratch near front panel",
        photo_urls: ["https://example.com/damage/sample.jpg"]
      })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to report damage");
      return;
    }
    await loadBookings();
  }

  return (
    <main>
      <h1>Customer Dashboard</h1>
      <p>Bengaluru booking, pricing, KYC, and damage-report flow.</p>

      <section className="card">
        <label htmlFor="cust-user">Customer User ID: </label>
        <select
          id="cust-user"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="cust_001">cust_001 (verified)</option>
          <option value="cust_002">cust_002 (kyc pending)</option>
        </select>
      </section>

      <section className="card">
        <h3>Booking Actions</h3>
        <button onClick={() => requestQuote()}>Get Quote</button>{" "}
        <button onClick={() => createBooking()}>Create Booking</button>{" "}
        <button onClick={() => loadBookings()}>Refresh Bookings</button>
        {quote ? <pre>{JSON.stringify(quote, null, 2)}</pre> : null}
      </section>

      <section className="card">
        <h3>My Bookings</h3>
        {bookings.length === 0 ? <p>No bookings yet.</p> : null}
        {bookings.map((booking) => (
          <div className="card" key={booking.id}>
            <div>Booking: {booking.id}</div>
            <div>Vehicle: {booking.vehicle_id}</div>
            <div>Status: {booking.status}</div>
            <div>Payable: INR {booking.quote.total_payable}</div>
            <button onClick={() => reportDamage(booking.id)}>Report Damage</button>
          </div>
        ))}
      </section>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
