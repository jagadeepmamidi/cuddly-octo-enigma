"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

interface NavItem {
  href: string;
  icon: IconName;
  label: string;
  badge?: string | number;
}

interface SidebarProps {
  role: "customer" | "partner" | "admin";
  navItems: NavItem[];
  userName?: string;
}

export default function Sidebar({ role, navItems, userName }: SidebarProps) {
  const pathname = usePathname();

  const roleLabels = {
    customer: "Customer",
    partner: "Partner / Investor",
    admin: "Admin"
  };

  const roleColors = {
    customer: "var(--primary-container)",
    partner: "var(--tertiary-container)",
    admin: "#8b5cf6"
  };

  const roleIcon: Record<SidebarProps["role"], IconName> = {
    customer: "scooter",
    partner: "chart",
    admin: "settings"
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/" className="inline-flex items-center gap-2">
          <Icon name="bike" className="w-5 h-5" />
          <span className="logo-mark">rbabikerentals</span>
        </Link>
        <span className="logo-sub">Bengaluru</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">
                <Icon name={item.icon} className="w-4 h-4" />
              </span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== "" && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {userName && (
          <div
            style={{
              marginBottom: 10,
              padding: "8px 12px",
              background: "var(--surface-high)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem"
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>
              {userName}
            </div>
            <div className="text-xs text-muted">{roleLabels[role]}</div>
          </div>
        )}
        <div
          className="sidebar-role-badge"
          style={{ color: roleColors[role], display: "inline-flex", gap: 8, alignItems: "center" }}
        >
          <Icon name={roleIcon[role]} className="w-4 h-4" />
          {roleLabels[role]}
        </div>
        <Link
          href="/"
          style={{
            display: "block",
            marginTop: 8,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--on-surface-dim)"
          }}
        >
          Back to Home
        </Link>
      </div>
    </aside>
  );
}
