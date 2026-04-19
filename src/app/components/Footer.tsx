import Link from "next/link";
import Icon from "./Icon";

const FOOTER_LINKS = {
  Company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact Us", href: "#" }
  ],
  Product: [
    { label: "Browse Bikes", href: "/browse" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing / Tariff", href: "#" },
    { label: "EV Bikes", href: "/browse" }
  ],
  Support: [
    { label: "Help Centre", href: "#" },
    { label: "Safety", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms & Conditions", href: "#" },
    { label: "FAQ", href: "#" }
  ],
  Partner: [
    { label: "List Your Bike", href: "/partner" },
    { label: "Earn with RBA", href: "#" },
    { label: "Franchise", href: "#" }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-bold mb-4">RBA</div>
            <p className="text-[#757575] text-xs leading-relaxed mb-5">
              Bengaluru bike rentals with transparent pricing, DigiLocker KYC, and flexible duration plans.
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <a href="#" className="text-[#afafaf] hover:text-white transition-colors inline-flex items-center gap-2">
                <Icon name="support" className="w-3.5 h-3.5" />
                Help Centre
              </a>
              <a href="/kyc" className="text-[#afafaf] hover:text-white transition-colors inline-flex items-center gap-2">
                <Icon name="mail" className="w-3.5 h-3.5" />
                KYC Support Flow
              </a>
              <a href="/my-bookings" className="text-[#afafaf] hover:text-white transition-colors inline-flex items-center gap-2">
                <Icon name="chat" className="w-3.5 h-3.5" />
                Booking Support
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-white font-bold text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-[#757575] hover:text-white text-xs transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[#757575] text-xs">© RBA Bike Rentals 2026 · Bengaluru, India</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <Link key={l} href="#" className="text-[#757575] hover:text-white text-xs transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
