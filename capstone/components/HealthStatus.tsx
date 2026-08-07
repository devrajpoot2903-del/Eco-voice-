"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  project: string;
  framework: string;
  version: string;
}

type FetchState = "idle" | "loading" | "success" | "error";

interface HealthField {
  label: string;
  key: keyof HealthData;
  icon: string;
}

const fields: HealthField[] = [
  { label: "Status", key: "status", icon: "🟢" },
  { label: "Project", key: "project", icon: "📦" },
  { label: "Framework", key: "framework", icon: "⚙️" },
  { label: "Version", key: "version", icon: "🏷️" },
];

export default function HealthStatus() {
  const [data, setData] = useState<HealthData | null>(null);
  const [state, setState] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: HealthData = await res.json();
      setData(json);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  };

  useEffect(() => {
    void (async () => {
      await fetchHealth();
    })();
  }, []);

  return (
    <div>
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--muted)",
          }}
        >
          {state === "loading" && <span>⏳ Fetching API…</span>}
          {state === "success" && (
            <span style={{ color: "var(--primary)" }}>✅ API reachable</span>
          )}
          {state === "error" && (
            <span style={{ color: "#dc2626" }}>❌ API unreachable</span>
          )}
        </div>
        <button
          id="health-refresh-btn"
          onClick={fetchHealth}
          disabled={state === "loading"}
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: state === "loading" ? "not-allowed" : "pointer",
            opacity: state === "loading" ? 0.7 : 1,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Error state */}
      {state === "error" && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            color: "#dc2626",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Data grid */}
      {data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {fields.map((field) => (
            <div
              key={field.key}
              style={{
                padding: "24px",
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>
                {field.icon}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                {field.label}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color:
                    field.key === "status"
                      ? "var(--primary)"
                      : "var(--foreground)",
                }}
              >
                {data[field.key]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {state === "loading" && !data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: "24px",
                backgroundColor: "var(--muted-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "12px",
                height: "100px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
