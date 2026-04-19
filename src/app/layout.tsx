import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "RBA Bike Rentals - Rent a Bike in Bengaluru",
  description:
    "Affordable, insured, flexible bike rentals in Bengaluru. Book scooters, bikes, and EVs with KYC-first onboarding and transparent pricing.",
  keywords: "bike rental, bengaluru, scooter, two-wheeler, rbabikerentals"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
