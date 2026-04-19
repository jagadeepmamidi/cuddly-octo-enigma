"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon, { type IconName } from "../components/Icon";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  category: string;
  is_active: boolean;
  rate_per_hour: number;
  rate_per_day: number;
  rate_per_week: number;
  rate_per_month: number;
  deposit_amount: number;
  city: string;
};

const VEHICLES: Vehicle[] = [
  {
    id: "veh_001",
    brand: "Honda",
    model: "Activa 6G",
    category: "scooter",
    is_active: true,
    rate_per_hour: 120,
    rate_per_day: 750,
    rate_per_week: 4200,
    rate_per_month: 15000,
    deposit_amount: 2000,
    city: "bengaluru"
  },
  {
    id: "veh_002",
    brand: "Yamaha",
    model: "MT-15",
    category: "bike",
    is_active: true,
    rate_per_hour: 180,
    rate_per_day: 1200,
    rate_per_week: 7000,
    rate_per_month: 25000,
    deposit_amount: 3000,
    city: "bengaluru"
  },
  {
    id: "veh_003",
    brand: "TVS",
    model: "iQube",
    category: "ev_bike",
    is_active: true,
    rate_per_hour: 140,
    rate_per_day: 900,
    rate_per_week: 5000,
    rate_per_month: 17000,
    deposit_amount: 2500,
    city: "bengaluru"
  }
];

const CATEGORY_ICONS: Record<string, IconName> = {
  scooter: "scooter",
  bike: "bike",
  ev_bike: "ev",
  cruiser: "bike"
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "scooter", label: "Scooters" },
  { key: "bike", label: "Bikes" },
  { key: "ev_bike", label: "EV Bikes" }
];

const DURATIONS = [
  { key: "hour", label: "Hourly", rateKey: "rate_per_hour" as keyof Vehicle },
  { key: "day", label: "Daily", rateKey: "rate_per_day" as keyof Vehicle },
  { key: "week", label: "Weekly", rateKey: "rate_per_week" as keyof Vehicle },
  { key: "month", label: "Monthly", rateKey: "rate_per_month" as keyof Vehicle }
];

function mapDurationParamToRateKey(param: string | null): keyof Vehicle {
  switch (param) {
    case "hourly":
      return "rate_per_hour";
    case "weekly":
      return "rate_per_week";
    case "monthly":
      return "rate_per_month";
    case "daily":
    default:
      return "rate_per_day";
  }
}

function VehicleCard({
  vehicle,
  durationKey
}: {
  vehicle: Vehicle;
  durationKey: keyof Vehicle;
}) {
  const rate = vehicle[durationKey] as number;
  const durLabel = DURATIONS.find((d) => d.rateKey === durationKey)?.label ?? "Day";
  const icon = CATEGORY_ICONS[vehicle.category] ?? "scooter";

  return (
    <Link href={`/book/${vehicle.id}`} className="block group">
      <div className="card hover:shadow-card-md transition-shadow duration-200">
        <div className="bg-uber-chip-gray aspect-[4/3] flex flex-col items-center justify-center gap-2">
          <span className="w-16 h-16 rounded-full border border-black/10 bg-white flex items-center justify-center">
            <Icon name={icon} className="w-8 h-8 text-black" />
          </span>
          <span className={`badge text-xs font-semibold ${vehicle.is_active ? "bg-black text-white" : "bg-uber-muted-gray text-white"}`}>
            {vehicle.is_active ? "Available" : "Unavailable"}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-lg leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <Icon name="location" className="w-3.5 h-3.5 text-uber-body-gray" />
            <span className="text-xs text-uber-body-gray capitalize">{vehicle.city}</span>
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold">₹{rate.toLocaleString()}</span>
            <span className="text-uber-body-gray text-sm">/{durLabel.toLowerCase().replace("ly", "")}</span>
          </div>

          <p className="text-xs text-uber-body-gray mb-4">Deposit: ₹{vehicle.deposit_amount.toLocaleString()}</p>

          <span className="btn-primary w-full text-center block py-2.5 text-sm group-hover:bg-zinc-800 transition-colors">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const initialDuration = mapDurationParamToRateKey(searchParams.get("duration"));
  const [category, setCategory] = useState("all");
  const [duration, setDuration] = useState<keyof Vehicle>(initialDuration);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "model">("price_asc");

  useEffect(() => {
    setDuration(mapDurationParamToRateKey(searchParams.get("duration")));
  }, [searchParams]);

  const currentDurLabel = DURATIONS.find((d) => d.rateKey === duration)?.label ?? "Daily";

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const list = VEHICLES.filter((v) => {
      const matchCat = category === "all" || v.category === category;
      const rate = v[duration] as number;
      const matchPrice = rate <= maxPrice;
      const matchQuery =
        !normalizedQuery || `${v.brand} ${v.model}`.toLowerCase().includes(normalizedQuery);
      return matchCat && matchPrice && matchQuery;
    });

    return list.sort((a, b) => {
      if (sortBy === "model") {
        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
      }
      const aRate = a[duration] as number;
      const bRate = b[duration] as number;
      return sortBy === "price_asc" ? aRate - bRate : bRate - aRate;
    });
  }, [category, duration, maxPrice, query, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 py-8">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-bold mb-1">Browse Bikes</h1>
          <p className="text-uber-body-gray text-sm">{filtered.length} vehicle(s) available in Bengaluru for selected filters</p>
        </div>
      </div>

      <div className="border-b border-black/10 bg-white sticky top-16 z-40">
        <div className="max-w-container mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`chip ${category === c.key ? "chip-active" : ""}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-8 w-px bg-black/10" />

          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDuration(d.rateKey)}
                className={`chip ${duration === d.rateKey ? "chip-active" : ""}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-8 w-px bg-black/10" />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-medium whitespace-nowrap">
              Max ₹{maxPrice.toLocaleString()}/{currentDurLabel.toLowerCase().replace("ly", "")}
            </label>
            <input
              type="range"
              min={120}
              max={30000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-black"
            />
          </div>

          <div className="hidden md:block h-8 w-px bg-black/10" />

          <div className="flex items-center gap-3 w-full sm:w-auto flex-col sm:flex-row">
            <div className="relative w-full sm:w-auto">
              <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-uber-body-gray" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search model"
                className="w-full sm:w-auto border border-black/15 rounded-pill pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <select
              className="w-full sm:w-auto border border-black/15 rounded-pill px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price_asc" | "price_desc" | "model")}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="model">Model Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
              <Icon name="search" className="w-7 h-7 text-black/60" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No vehicles match your filters</h2>
            <p className="text-uber-body-gray mb-6">Try adjusting category, price, or model search.</p>
            <button
              onClick={() => {
                setCategory("all");
                setMaxPrice(30000);
                setQuery("");
                setSortBy("price_asc");
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} durationKey={duration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
