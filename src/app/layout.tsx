import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rbabikerentals.com | Phase 1",
  description: "Bengaluru-first bike rental platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

