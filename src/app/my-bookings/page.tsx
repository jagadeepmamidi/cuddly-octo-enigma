"use client";

import { useCallback, useEffect, useState } from "react";
import Icon, { type IconName } from "../components/Icon";

type Booking = {
  id: string;
  status: string;
  vehicle_id: string;
  pickup_at: string;
  drop_at: string;
  quote: {
    total_payable: number;
    base_amount?: number;
    duration_amount?: number;
  };
  cancel_reason?: string;
};

const API_HEADERS = {
  "content-type": "application/json",
  "x-user-id": "cust_001",
  "x-role": "customer"
};

const VEHICLE_NAMES: Record<string, string> = {
  veh_001: "Honda Activa 6G",
  veh_002: "Yamaha MT-15",
  veh_003: "TVS iQube"
};

const VEHICLE_ICONS: Record<string, IconName> = {
  veh_001: "scooter",
  veh_002: "bike",
  veh_003: "ev"
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-black text-white",
  ongoing: "bg-zinc-700 text-white",
  completed: "bg-uber-chip-gray text-black",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-uber-chip-gray text-uber-body-gray",
  pending_kyc: "bg-amber-100 text-amber-800",
  payment_pending: "bg-amber-100 text-amber-800",
  extended: "bg-zinc-600 text-white",
  extension_requested: "bg-zinc-500 text-white"
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-uber-chip-gray text-black";
  return <span className={`badge ${cls} capitalize text-xs`}>{status.replace(/_/g, " ")}</span>;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/customer/bookings", { headers: API_HEADERS });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to load bookings");
      } else {
        setBookings(json.data.bookings);
      }
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this booking? Cancellation charges may apply.")) return;
    setActionLoading(`cancel-${id}`);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ reason: "Customer requested cancellation" })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Cancel failed");
      } else {
        showSuccess("Booking cancelled.");
        await fetchBookings();
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExtend(id: string) {
    setActionLoading(`extend-${id}`);
    const drop = new Date(Date.now() + 24 * 3_600_000).toISOString();
    try {
      const res = await fetch(`/api/bookings/${id}/extend`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          new_drop_at: drop,
          duration_bucket: "day",
          duration_value: 1,
          extra_helmet_count: 0
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Extend failed");
      } else {
        showSuccess("Booking extended by 1 day.");
        await fetchBookings();
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  const TABS = [
    { key: "all", label: "All" },
    { key: "confirmed", label: "Confirmed" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" }
  ];

  const filtered = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 py-8">
        <div className="max-w-container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">My Bookings</h1>
            <p className="text-uber-body-gray text-sm mt-1">
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · User: cust_001
            </p>
          </div>
          <a href="/browse" className="btn-primary text-sm py-2.5 px-5">
            New Booking
          </a>
        </div>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
        {successMsg && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm inline-flex items-center gap-2">
            <Icon name="checkCircle" className="w-4 h-4" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800 text-sm flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Icon name="warning" className="w-4 h-4" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600" aria-label="Dismiss error">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`chip ${tab === t.key ? "chip-active" : ""}`}
            >
              {t.label}
              {t.key !== "all" && bookings.filter((b) => b.status === t.key).length > 0 && (
                <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? "bg-white/20 text-white" : "bg-black/10"}`}>
                  {bookings.filter((b) => b.status === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-uber-body-gray" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-uber-body-gray">Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
              <Icon name="list" className="w-8 h-8 text-black/60" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{tab === "all" ? "No bookings yet" : `No ${tab} bookings`}</h2>
            <p className="text-uber-body-gray mb-6">
              {tab === "all" ? "Start by browsing available bikes." : "Try switching to a different tab."}
            </p>
            <a href="/browse" className="btn-primary">
              Browse Bikes
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((booking) => {
              const isActionable = ["confirmed", "ongoing", "extended"].includes(booking.status);
              const isCancellable = ["confirmed", "pending_kyc", "payment_pending"].includes(booking.status);
              const actCancel = actionLoading === `cancel-${booking.id}`;
              const actExtend = actionLoading === `extend-${booking.id}`;
              const vIcon = VEHICLE_ICONS[booking.vehicle_id] ?? "scooter";
              const vName = VEHICLE_NAMES[booking.vehicle_id] ?? booking.vehicle_id;

              return (
                <div key={booking.id} className="card border border-black/5 hover:shadow-card-md transition-shadow">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-20 h-20 bg-uber-chip-gray rounded-lg flex items-center justify-center text-black flex-shrink-0">
                        <Icon name={vIcon} className="w-10 h-10" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                          <h3 className="font-bold text-lg">{vName}</h3>
                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm mb-3">
                          <div>
                            <span className="text-xs text-uber-body-gray block">Pickup</span>
                            <span className="font-medium">{fmt(booking.pickup_at)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-uber-body-gray block">Drop</span>
                            <span className="font-medium">{fmt(booking.drop_at)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-uber-body-gray block">Total</span>
                            <span className="font-bold text-black">₹{booking.quote.total_payable.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-xs text-uber-muted-gray font-mono">ID: {booking.id}</div>
                        {booking.cancel_reason && <p className="text-xs text-red-600 mt-1">Reason: {booking.cancel_reason}</p>}
                      </div>
                    </div>

                    {(isActionable || isCancellable) && (
                      <div className="mt-4 pt-4 border-t border-black/5 flex gap-3 flex-wrap">
                        {isActionable && (
                          <button
                            onClick={() => handleExtend(booking.id)}
                            disabled={actExtend}
                            className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
                          >
                            {actExtend ? "Extending..." : "Extend +1 Day"}
                          </button>
                        )}
                        {isCancellable && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={actCancel}
                            className="btn-secondary text-sm py-2 px-5 disabled:opacity-50"
                          >
                            {actCancel ? "Cancelling..." : "Cancel Booking"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
