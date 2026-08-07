"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/health", label: "Health", icon: "💚" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--primary)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🌿
          </div>
          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "18px",
                color: "var(--foreground)",
                lineHeight: "1",
              }}
            >
              EcoVoice
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                marginTop: "2px",
              }}
            >
              Capstone
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 12px", flex: 1 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} style={{ marginBottom: "4px" }}>
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? "var(--primary-dark)" : "var(--muted)",
                    backgroundColor: isActive ? "var(--badge-bg)" : "transparent",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--sidebar-border)",
          fontSize: "12px",
          color: "var(--muted)",
        }}
      >
        <div>EcoVoice Capstone</div>
        <div style={{ marginTop: "2px" }}>FlyRank · Week 3+</div>
      </div>
    </aside>
  );
}
