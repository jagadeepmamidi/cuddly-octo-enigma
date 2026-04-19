"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Icon, { type IconName } from "../../components/Icon";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  category: string;
  rate_per_hour: number;
  rate_per_day: number;
  rate_per_week: number;
  rate_per_month: number;
  deposit_amount: number;
  city: string;
};

type Quote = {
  base_amount: number;
  duration_amount: number;
  addon_amount: number;
  coupon_discount: number;
  deposit_amount: number;
  tax_amount: number;
  total_payable: number;
  km_included: number;
  excess_km_rate: number;
};

const VEHICLES: Record<string, Vehicle> = {
  veh_001: {
    id: "veh_001",
    brand: "Honda",
    model: "Activa 6G",
    category: "scooter",
    rate_per_hour: 120,
    rate_per_day: 750,
    rate_per_week: 4200,
    rate_per_month: 15000,
    deposit_amount: 2000,
    city: "bengaluru"
  },
  veh_002: {
    id: "veh_002",
    brand: "Yamaha",
    model: "MT-15",
    category: "bike",
    rate_per_hour: 180,
    rate_per_day: 1200,
    rate_per_week: 7000,
    rate_per_month: 25000,
    deposit_amount: 3000,
    city: "bengaluru"
  },
  veh_003: {
    id: "veh_003",
    brand: "TVS",
    model: "iQube",
    category: "ev_bike",
    rate_per_hour: 140,
    rate_per_day: 900,
    rate_per_week: 5000,
    rate_per_month: 17000,
    deposit_amount: 2500,
    city: "bengaluru"
  }
};

const DURATION_OPTIONS = [
  { key: "hour", label: "Hourly", rateKey: "rate_per_hour", unit: "hr" },
  { key: "day", label: "Daily", rateKey: "rate_per_day", unit: "day" },
  { key: "week", label: "Weekly", rateKey: "rate_per_week", unit: "wk" },
  { key: "month", label: "Monthly", rateKey: "rate_per_month", unit: "mo" }
] as const;

type DurationBucket = "hour" | "day" | "week" | "month";

const API_HEADERS = {
  "content-type": "application/json",
  "x-user-id": "cust_001",
  "x-role": "customer"
};

const CATEGORY_ICONS: Record<string, IconName> = {
  scooter: "scooter",
  bike: "bike",
  ev_bike: "ev"
};

const SPECS: Record<string, Array<{ label: string; value: string }>> = {
  veh_001: [
    { label: "Engine", value: "109.51 cc, BS6" },
    { label: "Mileage", value: "~60 km/l" },
    { label: "Top Speed", value: "~80 km/h" },
    { label: "Fuel", value: "Petrol" }
  ],
  veh_002: [
    { label: "Engine", value: "155 cc, liquid-cooled" },
    { label: "Power", value: "18.5 bhp" },
    { label: "Top Speed", value: "~135 km/h" },
    { label: "Fuel", value: "Petrol" }
  ],
  veh_003: [
    { label: "Battery", value: "2.25 kWh" },
    { label: "Range", value: "~75 km/charge" },
    { label: "Top Speed", value: "~78 km/h" },
    { label: "Fuel", value: "Electric" }
  ]
};

function QuoteRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 text-sm ${highlight ? "font-bold text-black border-t border-black/10 mt-1 pt-3" : "text-uber-body-gray"}`}>
      <span>{label}</span>
      <span className="text-black">{value}</span>
    </div>
  );
}

export default function BookPage() {
  const params = useParams();
  const vehicleId = typeof params.vehicleId === "string" ? params.vehicleId : "";
  const vehicle = VEHICLES[vehicleId];

  const [durationBucket, setDurationBucket] = useState<DurationBucket>("day");
  const [durationValue, setDurationValue] = useState(1);
  const [extraHelmet, setExtraHelmet] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!vehicle) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          user_id: "cust_001",
          vehicle_id: vehicleId,
          city: "bengaluru",
          duration_bucket: durationBucket,
          duration_value: durationValue,
          extra_helmet_count: extraHelmet ? 1 : 0,
          coupon_code: coupon || undefined
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setQuoteError(json?.error?.message ?? "Could not fetch quote");
        setQuote(null);
      } else {
        setQuote(json.data);
      }
    } catch {
      setQuoteError("Network error fetching quote");
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [vehicle, vehicleId, durationBucket, durationValue, extraHelmet, coupon]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 300);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  async function handleReserve() {
    setBookingLoading(true);
    setBookingError(null);
    const now = Date.now();
    const hoursMap: Record<DurationBucket, number> = {
      hour: durationValue,
      day: durationValue * 24,
      week: durationValue * 168,
      month: durationValue * 720
    };
    const pickup = new Date(now + 3_600_000).toISOString();
    const drop = new Date(now + 3_600_000 + hoursMap[durationBucket] * 3_600_000).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          user_id: "cust_001",
          vehicle_id: vehicleId,
          city: "bengaluru",
          pickup_at: pickup,
          drop_at: drop,
          duration_bucket: durationBucket,
          duration_value: durationValue,
          km_limit_bucket: durationBucket,
          km_limit_value: 120,
          extra_helmet_count: extraHelmet ? 1 : 0,
          coupon_code: coupon || undefined
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBookingError(json?.error?.message ?? "Booking failed");
      } else {
        setBookingId(json.data.booking.id);
      }
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  if (!vehicle) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
          <Icon name="search" className="w-8 h-8 text-black/60" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Vehicle not found</h1>
        <p className="text-uber-body-gray mb-6">That vehicle ID does not exist.</p>
        <a href="/browse" className="btn-primary">
          Back to Browse
        </a>
      </div>
    );
  }

  if (bookingId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-6">
            <Icon name="checkCircle" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Booking Confirmed</h1>
          <p className="text-uber-body-gray mb-2 text-sm">Your booking is confirmed. Keep this ID for pickup verification.</p>
          <div className="bg-uber-chip-gray rounded-xl px-6 py-4 my-6 font-mono text-lg font-bold tracking-widest break-all">
            {bookingId}
          </div>
          {quote && (
            <p className="text-uber-body-gray text-sm mb-6">
              Total paid: <strong className="text-black">₹{quote.total_payable.toLocaleString()}</strong>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/my-bookings" className="btn-primary py-3 px-6">
              View My Bookings
            </a>
            <a href="/browse" className="btn-secondary py-3 px-6">
              Browse More
            </a>
          </div>
        </div>
      </div>
    );
  }

  const icon = CATEGORY_ICONS[vehicle.category] ?? "scooter";
  const specs = SPECS[vehicleId] ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-4 text-sm text-uber-body-gray">
          <a href="/browse" className="hover:text-black transition-colors">
            Back to Browse
          </a>
          <span className="mx-2">/</span>
          <span className="text-black font-medium">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10">
          <div>
            <div className="bg-uber-chip-gray rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-3 mb-8">
              <span className="w-24 h-24 rounded-full bg-white border border-black/10 flex items-center justify-center text-black">
                <Icon name={icon} className="w-12 h-12" />
              </span>
              <span className="badge bg-black text-white text-xs inline-flex items-center gap-1.5">
                <Icon name="location" className="w-3 h-3" />
                Bengaluru
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-1">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-uber-body-gray capitalize mb-6">{vehicle.category.replace("_", " ")}</p>

            {specs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {specs.map((s) => (
                  <div key={s.label} className="bg-uber-chip-gray rounded-lg px-4 py-3">
                    <div className="text-xs text-uber-body-gray mb-0.5">{s.label}</div>
                    <div className="font-bold text-sm">{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">Pricing</h2>
            <div className="card divide-y divide-black/5">
              {DURATION_OPTIONS.map((d) => (
                <div key={d.key} className="flex justify-between px-5 py-3 text-sm">
                  <span className="text-uber-body-gray">{d.label}</span>
                  <span className="font-bold">
                    ₹{(vehicle[d.rateKey as keyof Vehicle] as number).toLocaleString()}/{d.unit}
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-5 py-3 text-sm">
                <span className="text-uber-body-gray">Security Deposit</span>
                <span className="font-bold">₹{vehicle.deposit_amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-3">About this vehicle</h2>
              <p className="text-uber-body-gray text-sm leading-relaxed">
                This {vehicle.brand} {vehicle.model} is maintained by a verified RBA partner in {vehicle.city}. All
                vehicles are insured, road-legal, and regularly serviced. Security deposit is collected at booking and
                refunded on safe return. Excess kilometre charges apply per policy.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="card border border-black/10 p-6">
              <h2 className="text-xl font-bold mb-5">Reserve this bike</h2>

              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-uber-body-gray mb-2">Duration Type</label>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDurationBucket(d.key)}
                      className={`chip text-xs py-1.5 px-3 ${durationBucket === d.key ? "chip-active" : ""}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-uber-body-gray mb-2">
                  How many {durationBucket === "hour" ? "hours" : durationBucket === "day" ? "days" : durationBucket === "week" ? "weeks" : "months"}?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDurationValue(Math.max(1, durationValue - 1))}
                    className="w-8 h-8 rounded-full bg-uber-chip-gray hover:bg-uber-hover-gray flex items-center justify-center font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-8 text-center">{durationValue}</span>
                  <button
                    onClick={() => setDurationValue(durationValue + 1)}
                    className="w-8 h-8 rounded-full bg-uber-chip-gray hover:bg-uber-hover-gray flex items-center justify-center font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between py-3 border-t border-black/5">
                <div>
                  <div className="text-sm font-medium">Extra Helmet</div>
                  <div className="text-xs text-uber-body-gray">Additional ₹50/rental</div>
                </div>
                <button
                  onClick={() => setExtraHelmet(!extraHelmet)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${extraHelmet ? "bg-black" : "bg-uber-muted-gray"}`}
                  role="switch"
                  aria-checked={extraHelmet}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${extraHelmet ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="mb-4 border-t border-black/5 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-uber-body-gray mb-2">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME5"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="w-full border border-black rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="border-t border-black/10 pt-4 mb-4 min-h-[120px]">
                {quoteLoading ? (
                  <div className="flex items-center gap-2 text-uber-body-gray text-sm py-4">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Calculating price...
                  </div>
                ) : quoteError ? (
                  <p className="text-red-600 text-xs py-2">{quoteError}</p>
                ) : quote ? (
                  <>
                    <QuoteRow label="Base fare" value={`₹${quote.base_amount.toLocaleString()}`} />
                    <QuoteRow label="Duration" value={`₹${quote.duration_amount.toLocaleString()}`} />
                    {quote.addon_amount > 0 && <QuoteRow label="Add-ons (helmet)" value={`₹${quote.addon_amount.toLocaleString()}`} />}
                    {quote.coupon_discount > 0 && <QuoteRow label="Coupon discount" value={`-₹${quote.coupon_discount.toLocaleString()}`} />}
                    <QuoteRow label="Security deposit" value={`₹${quote.deposit_amount.toLocaleString()}`} />
                    <QuoteRow label="Tax" value={`₹${quote.tax_amount.toLocaleString()}`} />
                    <QuoteRow label="Total payable" value={`₹${quote.total_payable.toLocaleString()}`} highlight />
                    <p className="text-xs text-uber-muted-gray mt-2">
                      Includes {quote.km_included} km · ₹{quote.excess_km_rate}/km extra
                    </p>
                  </>
                ) : null}
              </div>

              {bookingError && <p className="text-red-600 text-xs mb-3">{bookingError}</p>}
              <button
                onClick={handleReserve}
                disabled={bookingLoading || quoteLoading || !quote}
                className="btn-primary w-full py-3.5 text-base relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Reserving...
                  </span>
                ) : (
                  "Reserve Now"
                )}
              </button>

              <p className="text-center text-xs text-uber-muted-gray mt-3">KYC required · Secure Razorpay checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
