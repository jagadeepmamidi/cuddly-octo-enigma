"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";

const NAV_LINKS = [
  { href: "/browse", label: "Browse Bikes" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/my-bookings", label: "My Bookings" },
  { href: "/kyc", label: "KYC" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10">
      <div className="max-w-container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl text-black tracking-tight select-none">
          RBA
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="chip text-sm">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/my-bookings"
            className="text-[#4b4b4b] hover:text-black text-sm font-medium transition-colors"
          >
            Bookings
          </Link>
          <Link href="/browse" className="btn-primary text-sm py-2 px-5">
            Book a Bike
          </Link>
        </div>

        <button
          className="md:hidden w-10 h-10 rounded-full bg-[#efefef] hover:bg-[#e2e2e2] flex items-center justify-center transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/10 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="chip text-sm text-center"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link href="/browse" className="btn-primary text-sm text-center block py-3" onClick={() => setOpen(false)}>
              Book a Bike
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
