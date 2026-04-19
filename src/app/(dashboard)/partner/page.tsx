"use client";

import { useEffect, useMemo, useState } from "react";

export default function PartnerDashboardPage() {
  const [partnerId, setPartnerId] = useState("partner_001");
  const [revenue, setRevenue] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      "x-user-id": partnerId,
      "x-role": "partner_investor"
    }),
    [partnerId]
  );

  async function fetchRevenue() {
    setError(null);
    const res = await fetch("/api/partner/revenue", { headers });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to fetch revenue");
      return;
    }
    setRevenue(json.data);
  }

  async function createBlockWindow() {
    setError(null);
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch("/api/vehicles/veh_001/block", {
      method: "POST",
      headers,
      body: JSON.stringify({
        starts_at: start,
        ends_at: end,
        reason: "scheduled_maintenance"
      })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to block vehicle");
      return;
    }
    await fetchRevenue();
  }

  useEffect(() => {
    fetchRevenue().catch((e) => setError(String(e)));
  }, [partnerId]);

  return (
    <main>
      <h1>Partner/Investor Dashboard</h1>
      <p>Revenue, booking lifecycle, and vehicle block operations.</p>

      <section className="card">
        <label htmlFor="partner-id">Partner User ID: </label>
        <select
          id="partner-id"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        >
          <option value="partner_001">partner_001</option>
        </select>
      </section>

      <section className="card">
        <button onClick={() => fetchRevenue()}>Refresh Revenue</button>{" "}
        <button onClick={() => createBlockWindow()}>Create Maintenance Block</button>
      </section>

      <section className="card">
        <h3>Revenue Snapshot</h3>
        <pre>{JSON.stringify(revenue, null, 2)}</pre>
      </section>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </main>
  );
}
