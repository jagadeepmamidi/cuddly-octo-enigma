export default function HomePage() {
  return (
    <main>
      <h1>Rbabikerentals.com Phase 1 Scaffold</h1>
      <p>
        Scope is Bengaluru-only in this phase with role surfaces for customer,
        partner/investor, and admin.
      </p>

      <div className="grid grid-3">
        <section className="card">
          <h3>Customer</h3>
          <p>Discovery, booking, KYC, pricing, coupons, and ride operations.</p>
        </section>
        <section className="card">
          <h3>Partner/Investor</h3>
          <p>Fleet status, booking lifecycle visibility, and revenue reporting.</p>
        </section>
        <section className="card">
          <h3>Admin</h3>
          <p>KYC queue, booking controls, vehicle controls, and audits.</p>
        </section>
      </div>

      <section className="card">
        <h3>Implemented API Endpoints</h3>
        <ul>
          <li>POST /api/quotes</li>
          <li>POST /api/bookings</li>
          <li>POST /api/bookings/[id]/extend</li>
          <li>POST /api/bookings/[id]/cancel</li>
          <li>POST /api/kyc/digilocker/start</li>
          <li>GET /api/kyc/[userId]</li>
          <li>GET /api/partner/revenue</li>
          <li>POST /api/vehicles/[id]/block</li>
          <li>GET /api/admin/bookings</li>
          <li>POST /api/admin/bookings/[id]/reject</li>
        </ul>
      </section>
    </main>
  );
}

