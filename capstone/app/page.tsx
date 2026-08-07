import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description:
    "EcoVoice — a voice-first task management application built with Next.js.",
};

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", description: "Overview of your activity" },
  { href: "/tasks", label: "Tasks", icon: "✅", description: "Manage your tasks" },
  { href: "/history", label: "History", icon: "📋", description: "View past activity" },
  { href: "/settings", label: "Settings", icon: "⚙️", description: "Configure the app" },
  { href: "/health", label: "Health", icon: "💚", description: "Check API status" },
];

export default function HomePage() {
  return (
    <div>
      <PageHeader
        title="Welcome to EcoVoice"
        description="A voice-first task management application. This is the capstone Next.js architecture used from Week 3 onward in the FlyRank internship."
      />

      {/* Status badge */}
      <div style={{ marginBottom: "32px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            backgroundColor: "var(--badge-bg)",
            color: "var(--badge-text)",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          <span>🟢</span> Capstone Skeleton · Next.js 16 · App Router
        </span>
      </div>

      {/* Quick Navigation Grid */}
      <section>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--foreground)",
            marginBottom: "16px",
          }}
        >
          Quick Navigation
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "20px",
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: "28px" }}>{link.icon}</span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "var(--foreground)",
                }}
              >
                {link.label}
              </span>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
