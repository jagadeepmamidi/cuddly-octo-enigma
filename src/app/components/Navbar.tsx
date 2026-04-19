"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/browse", label: "Browse Bikes" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/my-bookings", label: "My Bookings" },
  { href: "/kyc", label: "KYC" }
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/#how-it-works") {
    return pathname === "/";
  }
  return pathname === href;
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (!open) {
      return;
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="select-none text-2xl font-bold tracking-tight text-black">
            RBA
          </Link>
          <p className="hidden lg:block text-[11px] font-medium uppercase tracking-[0.24em] text-[#8a8a8a]">
            Bengaluru Bike Rentals
          </p>
        </div>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 text-sm font-medium transition-colors ${
                  active ? "text-black" : "text-[#666] hover:text-black"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 -bottom-[19px] h-0.5 rounded-full bg-black transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Book a Bike
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#f3f4f6] text-black transition-colors hover:bg-[#ebedf0] md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-white px-4 py-4 md:hidden">
          <nav className="mx-auto flex max-w-container flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-black text-white"
                      : "text-black hover:bg-[#f3f4f6]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/browse"
              className="mt-2 rounded-full bg-black px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:hidden"
              onClick={() => setOpen(false)}
            >
              Book a Bike
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
