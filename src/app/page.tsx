"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "./components/Icon";

type VehicleCardData = {
  id: string;
  name: string;
  category: "Scooter" | "Bike" | "EV";
  icon: IconName;
  priceDay: number;
  priceWeek: number;
  priceMonth: number;
  deposit: number;
  spec: string;
  badge: string | null;
};

const VEHICLES: VehicleCardData[] = [
  {
    id: "veh_001",
    name: "Honda Activa 6G",
    category: "Scooter",
    icon: "scooter",
    priceDay: 750,
    priceWeek: 4200,
    priceMonth: 15000,
    deposit: 2000,
    spec: "109 cc · BS6",
    badge: "City Commute"
  },
  {
    id: "veh_002",
    name: "Yamaha MT-15",
    category: "Bike",
    icon: "bike",
    priceDay: 1200,
    priceWeek: 7000,
    priceMonth: 25000,
    deposit: 3000,
    spec: "155 cc · Liquid cooled",
    badge: null
  },
  {
    id: "veh_003",
    name: "TVS iQube",
    category: "EV",
    icon: "ev",
    priceDay: 900,
    priceWeek: 5000,
    priceMonth: 17000,
    deposit: 2500,
    spec: "Electric · 75 km range",
    badge: "Electric"
  }
];

const HOW_STEPS: Array<{ num: string; icon: IconName; title: string; desc: string }> = [
  {
    num: "01",
    icon: "location",
    title: "Pick a Hub",
    desc: "Choose your pickup area in Bengaluru and your rental duration."
  },
  {
    num: "02",
    icon: "scooter",
    title: "Select a Bike",
    desc: "Compare scooters, bikes, and EV options with transparent pricing."
  },
  {
    num: "03",
    icon: "idCard",
    title: "Complete KYC",
    desc: "Verify via DigiLocker once, then reuse it for future bookings."
  },
  {
    num: "04",
    icon: "shield",
    title: "Pay and Ride",
    desc: "Checkout through Razorpay and manage extension or cancellation online."
  }
];

const RENTAL_PLANS = [
  { name: "Hourly", detail: "Quick errands and short city trips", value: "From ₹120/hour" },
  { name: "Daily", detail: "Single-day rides and office commute", value: "From ₹750/day" },
  { name: "Weekly", detail: "Travel-heavy weeks and work assignments", value: "From ₹4,200/week" },
  { name: "Monthly", detail: "Long stays and recurring local travel", value: "From ₹15,000/month" }
];

const SERVICES_OFFER = {
  left: {
    eyebrow: "Daily Rentals",
    title: "Flexible city rides",
    cta: "Rent Now",
    points: [
      { label: "Flexible Window", text: "Choose preferred pickup and drop timings." },
      { label: "Transparent Quote", text: "Base fare, add-ons, tax, and deposit shown upfront." },
      { label: "Duration Choice", text: "Hourly, daily, weekly, and monthly options." },
      { label: "Policy Controlled", text: "Extension and cancellation handled through booking flows." }
    ]
  },
  right: {
    eyebrow: "Monthly Subscription",
    title: "For repeat commuters",
    cta: "Explore Monthly",
    points: [
      { label: "Month Plan Support", text: "Monthly duration bucket is supported in pricing and booking." },
      { label: "Operational Oversight", text: "Partner dashboard supports fleet and maintenance planning." },
      { label: "KYC-first Access", text: "DigiLocker-based KYC gating before payment confirmation." },
      { label: "Digital Payments", text: "Razorpay order and webhook confirmation flow enabled." }
    ]
  }
};

const TRUST_FACTS: Array<{ icon: IconName; title: string; detail: string }> = [
  {
    icon: "money",
    title: "Transparent Pricing",
    detail: "Your quote shows base fare, add-ons, tax, and deposit before confirmation."
  },
  {
    icon: "shield",
    title: "Secure Checkout",
    detail: "Payment order and webhook confirmation are integrated with Razorpay."
  },
  {
    icon: "idCard",
    title: "Digital KYC",
    detail: "KYC flow supports DigiLocker start, callback, and status polling."
  },
  {
    icon: "support",
    title: "Operations Coverage",
    detail: "Customer, partner, and admin dashboards are available for day-to-day operations."
  }
];

const LOCATIONS = [
  "Indiranagar",
  "Koramangala",
  "Whitefield",
  "Electronic City",
  "Marathahalli",
  "HSR Layout",
  "Jayanagar",
  "BTM Layout",
  "Hebbal",
  "Yelahanka",
  "Bellandur",
  "JP Nagar"
];

const FAQS = [
  {
    q: "What documents are required for booking?",
    a: "Aadhaar and Driving Licence are required for the DigiLocker-based KYC flow."
  },
  {
    q: "How is the deposit handled?",
    a: "Security deposit is added during booking and tied to return condition workflows."
  },
  {
    q: "Can I extend a live booking?",
    a: "Yes. Extension is available through the booking flow, subject to vehicle availability."
  },
  {
    q: "How is pricing shown?",
    a: "Quotes include base fare, duration amount, add-ons, tax, coupon impact, and total payable."
  }
];

const TIME_OPTIONS = Array.from({ length: 36 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const labelDate = new Date(2026, 0, 1, hours, minutes);
  return {
    value,
    label: labelDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
  };
});

function toDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function fromDateTimeParts(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function nearestTimeSlot(date: Date) {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  let closest = TIME_OPTIONS[0].value;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const slot of TIME_OPTIONS) {
    const [hours, minutes] = slot.value.split(":").map(Number);
    const slotMinutes = hours * 60 + minutes;
    const distance = Math.abs(slotMinutes - totalMinutes);
    if (distance < bestDistance) {
      closest = slot.value;
      bestDistance = distance;
    }
  }
  return closest;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addMonths(date: Date, value: number) {
  return new Date(date.getFullYear(), date.getMonth() + value, 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildCalendarCells(viewMonth: Date) {
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  return Array.from({ length: 42 }, (_, offset) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + offset);
    return {
      date,
      inCurrentMonth: date.getMonth() === viewMonth.getMonth()
    };
  });
}

function buildInitialSchedule() {
  const now = new Date();
  const pickup = new Date(now.getTime() + 60 * 60 * 1000);
  const drop = new Date(pickup.getTime() + 24 * 60 * 60 * 1000);
  return {
    pickupDate: toDateValue(pickup),
    pickupTime: nearestTimeSlot(pickup),
    dropDate: toDateValue(drop),
    dropTime: nearestTimeSlot(drop)
  };
}

function toDateTimeIso(dateValue: string, timeValue: string) {
  return fromDateTimeParts(dateValue, timeValue).toISOString();
}

function hoursForDuration(duration: "hourly" | "daily" | "weekly" | "monthly") {
  switch (duration) {
    case "hourly":
      return 1;
    case "daily":
      return 24;
    case "weekly":
      return 24 * 7;
    case "monthly":
      return 24 * 30;
    default:
      return 24;
  }
}

function formatDateLabel(dateValue: string) {
  const date = parseDateValue(dateValue);
  if (!date) return "Select date";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTimeLabel(dateValue: string, timeValue: string) {
  const date = fromDateTimeParts(dateValue, timeValue);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }) + ` ${timeValue}`;
}

function CalendarDatePicker({
  value,
  onChange,
  minDate
}: {
  value: string;
  onChange: (next: string) => void;
  minDate?: string;
}) {
  const selectedDate = parseDateValue(value) ?? new Date();
  const min = minDate ? parseDateValue(minDate) : null;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  useEffect(() => {
    const picked = parseDateValue(value);
    if (!picked) return;
    setViewMonth(new Date(picked.getFullYear(), picked.getMonth(), 1));
  }, [value]);

  const cells = useMemo(() => buildCalendarCells(viewMonth), [viewMonth]);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-between"
      >
        <span className="text-left">{formatDateLabel(value)}</span>
        <Icon name="calendar" className="w-4 h-4 text-[#4b4b4b]" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-[320px] max-w-[calc(100vw-4rem)] rounded-xl border border-black/15 bg-white p-3 shadow-[rgba(0,0,0,0.20)_0px_12px_24px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth((month) => addMonths(month, -1))}
              className="w-8 h-8 rounded-lg border border-black/20 text-black hover:bg-black hover:text-white transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-sm font-bold">
              {viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className="w-8 h-8 rounded-lg border border-black/20 text-black hover:bg-black hover:text-white transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[11px] font-semibold text-[#767676] py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const dateValue = toDateValue(cell.date);
              const disabled = !!min && startOfDay(cell.date).getTime() < startOfDay(min).getTime();
              const selected = isSameDay(cell.date, selectedDate);
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-black text-white"
                      : cell.inCurrentMonth
                        ? "text-black hover:bg-black/5"
                        : "text-[#b0b0b0] hover:bg-black/5"
                  } ${disabled ? "opacity-35 cursor-not-allowed hover:bg-transparent" : ""}`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/10 last:border-0">
      <button
        className="w-full text-left py-5 flex justify-between items-center gap-4 group"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-black text-sm sm:text-base group-hover:opacity-70 transition-opacity">{q}</span>
        <span className={`text-2xl font-thin text-black/50 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && <p className="text-[#4b4b4b] text-sm pb-5 leading-relaxed pr-8 max-w-2xl">{a}</p>}
    </div>
  );
}

function VehicleCard({ v }: { v: VehicleCardData }) {
  return (
    <Link href={`/book/${v.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-[rgba(0,0,0,0.12)_0px_4px_16px_0px] hover:shadow-[rgba(0,0,0,0.20)_0px_8px_24px_0px] transition-shadow duration-300">
        <div className="relative bg-[#f5f5f5] aspect-[16/9] flex items-center justify-center">
          <span className="w-20 h-20 rounded-full border border-black/10 bg-white flex items-center justify-center text-black">
            <Icon name={v.icon} className="w-10 h-10" />
          </span>
          {v.badge && (
            <div className="absolute top-3 left-3 bg-black text-white text-[11px] font-semibold px-3 py-1 rounded-pill">
              {v.badge}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white text-black text-[11px] font-semibold px-3 py-1 rounded-pill shadow-[rgba(0,0,0,0.12)_0px_2px_8px] inline-flex items-center gap-1">
            <Icon name="location" className="w-3 h-3" />
            Bengaluru
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-black text-lg leading-tight">{v.name}</h3>
            <span className="text-xs text-[#4b4b4b] bg-[#efefef] rounded-pill px-3 py-1 font-medium">{v.category}</span>
          </div>
          <p className="text-xs text-[#afafaf] mb-5">{v.spec}</p>

          <div className="grid grid-cols-3 divide-x divide-black/10 mb-5 border border-black/10 rounded-xl overflow-hidden">
            {[
              { label: "Daily", price: v.priceDay },
              { label: "Weekly", price: v.priceWeek },
              { label: "Monthly", price: v.priceMonth }
            ].map((p) => (
              <div key={p.label} className="text-center py-3">
                <div className="text-[10px] text-[#afafaf] uppercase tracking-wider mb-1">{p.label}</div>
                <div className="font-bold text-black text-sm">₹{p.price.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#afafaf]">Deposit ₹{v.deposit.toLocaleString()}</span>
            <span className="text-black font-bold text-sm group-hover:underline">Book Now</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const initialSchedule = useMemo(() => buildInitialSchedule(), []);
  const [duration, setDuration] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily");
  const [pickupDate, setPickupDate] = useState(initialSchedule.pickupDate);
  const [pickupTime, setPickupTime] = useState(initialSchedule.pickupTime);
  const [dropDate, setDropDate] = useState(initialSchedule.dropDate);
  const [dropTime, setDropTime] = useState(initialSchedule.dropTime);
  const [pickupLocation, setPickupLocation] = useState(LOCATIONS[0]);

  useEffect(() => {
    const pickupAt = fromDateTimeParts(pickupDate, pickupTime);
    const nextDrop = new Date(pickupAt.getTime() + hoursForDuration(duration) * 60 * 60 * 1000);
    setDropDate(toDateValue(nextDrop));
    setDropTime(nearestTimeSlot(nextDrop));
  }, [duration, pickupDate, pickupTime]);

  useEffect(() => {
    const pickupAt = fromDateTimeParts(pickupDate, pickupTime);
    const dropAt = fromDateTimeParts(dropDate, dropTime);
    if (dropAt.getTime() <= pickupAt.getTime()) {
      const fallbackDrop = new Date(pickupAt.getTime() + 60 * 60 * 1000);
      setDropDate(toDateValue(fallbackDrop));
      setDropTime(nearestTimeSlot(fallbackDrop));
    }
  }, [pickupDate, pickupTime, dropDate, dropTime]);

  const pickupAtIso = toDateTimeIso(pickupDate, pickupTime);
  const dropAtIso = toDateTimeIso(dropDate, dropTime);
  const searchHref = `/browse?duration=${duration}&pickup_at=${encodeURIComponent(pickupAtIso)}&drop_at=${encodeURIComponent(dropAtIso)}&pickup_location=${encodeURIComponent(pickupLocation)}`;

  return (
    <div className="bg-white">
      <section className="bg-black min-h-[calc(100vh-64px)] flex items-center py-12 sm:py-16">
        <div className="max-w-container mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-center">
            <div className="text-white">
              <p className="text-[#afafaf] text-xs font-medium tracking-[0.2em] uppercase mb-6">Bengaluru Bike Rentals</p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.06] mb-6">Rent a Bike in Bengaluru</h1>
              <p className="text-[#afafaf] text-lg mb-10 leading-relaxed max-w-md">
                Fast booking for scooters, bikes, and EVs with digital KYC and transparent checkout.
              </p>

              <div className="flex flex-wrap gap-2 mb-10">
                {[
                  { icon: "idCard", text: "DigiLocker KYC" },
                  { icon: "shield", text: "Secure payment flow" },
                  { icon: "money", text: "Transparent pricing" },
                  { icon: "clock", text: "Flexible durations" }
                ].map((t) => (
                  <span key={t.text} className="chip text-xs border border-black/15 text-black inline-flex items-center gap-1.5">
                    <Icon name={t.icon as IconName} className="w-3.5 h-3.5" />
                    {t.text}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-white/10 pt-8 max-w-xl">
                {[
                  { n: "Hourly to Monthly", l: "Rental plans" },
                  { n: "Customer + Partner + Admin", l: "Operational flows" },
                  { n: "Booking + Extension + Cancellation", l: "Lifecycle coverage" }
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-sm font-bold text-white leading-tight">{s.n}</div>
                    <div className="text-[#afafaf] text-xs mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-[rgba(0,0,0,0.40)_0px_24px_40px]">
              <h2 className="font-bold text-black text-lg mb-1">Book a Bike</h2>
              <p className="text-[#afafaf] text-xs mb-5">Select duration, dates, and pickup location</p>

              <div className="flex gap-1 mb-5 bg-[#efefef] rounded-pill p-1">
                {(["hourly", "daily", "weekly", "monthly"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-pill text-xs font-semibold capitalize transition-colors ${
                      duration === d ? "bg-black text-white" : "text-[#4b4b4b] hover:text-black"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#afafaf] mb-1.5">Pickup Date & Time</label>
                  <div className="w-full border border-black rounded-lg p-2.5 bg-white grid grid-cols-1 sm:grid-cols-[1fr_138px] gap-2">
                    <CalendarDatePicker
                      value={pickupDate}
                      onChange={setPickupDate}
                      minDate={toDateValue(new Date())}
                    />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full border border-black/20 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={`pickup-time-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#afafaf] mb-1.5">Drop Date & Time</label>
                  <div className="w-full border border-black rounded-lg p-2.5 bg-white grid grid-cols-1 sm:grid-cols-[1fr_138px] gap-2">
                    <CalendarDatePicker
                      value={dropDate}
                      onChange={setDropDate}
                      minDate={pickupDate}
                    />
                    <select
                      value={dropTime}
                      onChange={(e) => setDropTime(e.target.value)}
                      className="w-full border border-black/20 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {TIME_OPTIONS.map((option) => (
                        <option key={`drop-time-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#afafaf] mb-1.5">Pickup Location</label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full border border-black rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-[#4b4b4b] mb-3">
                {formatDateTimeLabel(pickupDate, pickupTime)} to {formatDateTimeLabel(dropDate, dropTime)}
              </p>

              <Link href={searchHref} className="btn-primary w-full text-center block py-3.5 text-base">
                Search Available Bikes
              </Link>

              <p className="text-center text-[10px] text-[#afafaf] mt-3">Secure checkout · Policy-first pricing · Online booking updates</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-2">Our Fleet</p>
              <h2 className="text-4xl font-bold text-black">Popular Rides in Bengaluru</h2>
            </div>
            <Link href="/browse" className="btn-primary whitespace-nowrap self-start sm:self-auto">
              View All Bikes
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VEHICLES.map((v) => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-[#f7f7f7]">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-2">Simple Process</p>
            <h2 className="text-4xl font-bold">How It Works</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className="bg-white rounded-xl p-7 shadow-[rgba(0,0,0,0.08)_0px_2px_12px] relative">
                <div className="text-4xl font-bold text-black/8 mb-4 select-none leading-none">{step.num}</div>
                <div className="w-10 h-10 rounded-full bg-[#efefef] flex items-center justify-center mb-3 text-black">
                  <Icon name={step.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-black text-base mb-2">{step.title}</h3>
                <p className="text-[#4b4b4b] text-sm leading-relaxed">{step.desc}</p>
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#afafaf] text-lg z-10">›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-black/10">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-2">Rental Plans</p>
            <h2 className="text-4xl font-bold text-black">Choose the Right Duration</h2>
            <p className="text-[#4b4b4b] text-sm mt-3 max-w-xl">
              Inspired by city rental workflows: pick the plan that matches your ride intent and budget.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RENTAL_PLANS.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-black/10 p-5 bg-white shadow-[rgba(0,0,0,0.06)_0px_2px_12px]">
                <div className="text-xs uppercase tracking-wider text-[#afafaf] mb-2">{plan.name}</div>
                <div className="text-black font-bold text-lg mb-1">{plan.value}</div>
                <p className="text-[#4b4b4b] text-sm">{plan.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-[#f2f3f5] border-t border-black/10">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#526074] text-xs uppercase tracking-widest font-semibold mb-2">Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-black">Services We Offer</h2>
            <div className="w-20 h-0.5 bg-black/20 mx-auto mt-3" />
          </div>

          <div className="relative rounded-2xl border border-black/10 bg-white overflow-hidden">
            <div className="grid xl:grid-cols-[1fr_520px_1fr]">
              <div className="p-8 md:p-10">
                <p className="text-xs uppercase tracking-wider text-[#526074] mb-2">{SERVICES_OFFER.left.eyebrow}</p>
                <h3 className="text-2xl sm:text-3xl font-bold mb-8">{SERVICES_OFFER.left.title}</h3>
                <div className="space-y-5 mb-10">
                  {SERVICES_OFFER.left.points.map((point) => (
                    <div key={point.label}>
                      <div className="text-lg font-bold text-black">{point.label}</div>
                      <div className="text-[#4b4b4b]">{point.text}</div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center rounded-xl bg-black hover:bg-zinc-800 text-white font-bold px-8 py-3 transition-colors"
                >
                  {SERVICES_OFFER.left.cta}
                </Link>
              </div>

              <div className="relative min-h-[360px] xl:min-h-full bg-gradient-to-b from-[#eef1f4] to-[#e5eaf0] border-y xl:border-y-0 xl:border-x border-black/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-72 h-72 rounded-full bg-black/5 -translate-x-16" />
                  <div className="absolute w-72 h-72 rounded-full bg-black/10 translate-x-16" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-5 px-4">
                  <div className="w-[210px] sm:w-[230px] rounded-2xl bg-white border border-black/10 shadow-[rgba(0,0,0,0.16)_0px_12px_26px] overflow-hidden -rotate-2">
                    <img
                      src="https://images.pexels.com/photos/1629180/pexels-photo-1629180.jpeg?auto=compress&cs=tinysrgb&w=900"
                      alt="Motorcycle available for daily rentals"
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                    <div className="px-3 py-2 text-xs font-semibold text-black bg-white">Daily Rental Bikes</div>
                  </div>
                  <div className="w-[210px] sm:w-[230px] rounded-2xl bg-white border border-black/10 shadow-[rgba(0,0,0,0.16)_0px_12px_26px] overflow-hidden rotate-2">
                    <img
                      src="https://images.pexels.com/photos/8442674/pexels-photo-8442674.jpeg?auto=compress&cs=tinysrgb&w=900"
                      alt="Scooter available for monthly subscription"
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                    <div className="px-3 py-2 text-xs font-semibold text-black bg-white">Monthly Subscription Scooters</div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <p className="text-xs uppercase tracking-wider text-[#526074] mb-2 text-left xl:text-right">{SERVICES_OFFER.right.eyebrow}</p>
                <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-left xl:text-right">{SERVICES_OFFER.right.title}</h3>
                <div className="space-y-5 mb-10">
                  {SERVICES_OFFER.right.points.map((point) => (
                    <div key={point.label} className="text-left xl:text-right">
                      <div className="text-lg font-bold text-black">{point.label}</div>
                      <div className="text-[#4b4b4b]">{point.text}</div>
                    </div>
                  ))}
                </div>
                <div className="text-left xl:text-right">
                  <Link
                    href="/browse"
                    className="inline-flex items-center justify-center rounded-xl border border-black text-black hover:bg-black hover:text-white font-bold px-8 py-3 transition-colors"
                  >
                    {SERVICES_OFFER.right.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-black text-white">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-4">Trust Signals</p>
              <h2 className="text-4xl font-bold mb-6 leading-tight">Built for Policy-First Bike Rentals</h2>
              <p className="text-[#757575] mb-10 leading-relaxed max-w-md">
                This platform focuses on verifiable workflows: quote transparency, digital KYC, webhook-based payment confirmation, and role-based operations.
              </p>

              <div className="flex flex-col gap-5">
                {TRUST_FACTS.map((f) => (
                  <div key={f.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      <Icon name={f.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{f.title}</div>
                      <div className="text-[#757575] text-sm mt-0.5 leading-relaxed">{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white text-black rounded-xl p-6 border border-black/10">
              <h3 className="font-bold text-black text-xl mb-4">Policy Snapshot</h3>
              <div className="space-y-3 text-sm text-[#4b4b4b]">
                <div className="flex gap-3 items-start">
                  <Icon name="checkCircle" className="w-4 h-4 mt-0.5 text-black" />
                  <span>KYC verification required before payment confirmation.</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="checkCircle" className="w-4 h-4 mt-0.5 text-black" />
                  <span>Pricing includes fare, tax, and deposit in the quote response.</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="checkCircle" className="w-4 h-4 mt-0.5 text-black" />
                  <span>Booking lifecycle supports extension, cancellation, and damage reporting.</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="checkCircle" className="w-4 h-4 mt-0.5 text-black" />
                  <span>Partner and admin dashboards support fleet and KYC operations.</span>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Link href="/browse" className="btn-primary block text-center py-3 flex-1">
                  Browse Bikes
                </Link>
                <Link href="/kyc" className="btn-secondary block text-center py-3 flex-1">
                  Start KYC
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-2">Coverage</p>
            <h2 className="text-4xl font-bold text-black">Pickup Hubs Across Bengaluru</h2>
            <p className="text-[#4b4b4b] text-sm mt-3 max-w-md">Choose a convenient pickup zone during booking and confirm availability in flow.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {LOCATIONS.map((loc) => (
              <div key={loc} className="chip text-center text-xs hover:bg-black hover:text-white transition-colors inline-flex items-center justify-center gap-1.5">
                <Icon name="location" className="w-3.5 h-3.5" />
                {loc}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-[#f7f7f7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-2">FAQ</p>
            <h2 className="text-4xl font-bold text-black">Common Questions</h2>
          </div>

          <div className="bg-white rounded-xl border border-black/8 shadow-[rgba(0,0,0,0.06)_0px_2px_16px] px-4 sm:px-8 py-2">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-black text-white">
        <div className="max-w-container mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#afafaf] text-xs uppercase tracking-widest font-semibold mb-4">Get Started</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">Ready to Ride?</h2>
          <p className="text-[#757575] max-w-md mx-auto mb-10 leading-relaxed">
            Complete KYC once and book any available bike with transparent pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse" className="btn-primary py-3.5 px-10 text-base">
              Browse Bikes
            </Link>
            <Link
              href="/kyc"
              className="inline-flex items-center justify-center rounded-pill border border-white bg-transparent text-white py-3.5 px-10 text-base font-medium transition-colors hover:bg-white hover:text-black"
            >
              Start KYC
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

