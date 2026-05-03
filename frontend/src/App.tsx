import { lazy, Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const HomePage = lazy(() => import("@/app/page"));
const BrowsePage = lazy(() => import("@/app/browse/page"));
const BookPage = lazy(() => import("@/app/book/[vehicleId]/page"));
const MyBookingsPage = lazy(() => import("@/app/my-bookings/page"));
const KycPage = lazy(() => import("@/app/kyc/page"));
const CustomerDashboard = lazy(() => import("@/app/(dashboard)/customer/page"));
const PartnerDashboard = lazy(() => import("@/app/(dashboard)/partner/page"));
const AdminDashboard = lazy(() => import("@/app/(dashboard)/admin/page"));

function resolveRoute(pathname: string) {
  if (pathname === "/") return <HomePage />;
  if (pathname === "/browse") return <BrowsePage />;
  if (pathname.startsWith("/book/")) return <BookPage />;
  if (pathname === "/my-bookings") return <MyBookingsPage />;
  if (pathname === "/kyc") return <KycPage />;
  if (pathname === "/customer") return <CustomerDashboard />;
  if (pathname === "/partner") return <PartnerDashboard />;
  if (pathname === "/admin") return <AdminDashboard />;

  return (
    <div className="min-h-[60vh] bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-24">
        <h1 className="text-4xl font-bold mb-3">Page not found</h1>
        <a href="/" className="btn-primary inline-flex">
          Go home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-white text-black antialiased">
      <Navbar />
      <main>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          {resolveRoute(window.location.pathname)}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
