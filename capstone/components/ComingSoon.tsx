interface ComingSoonProps {
  feature?: string;
}

export default function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 32px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚧</div>
      <h2
        style={{
          margin: "0 0 8px 0",
          fontSize: "20px",
          fontWeight: "600",
          color: "var(--foreground)",
        }}
      >
        Coming Soon
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "var(--muted)",
          maxWidth: "360px",
          lineHeight: "1.6",
        }}
      >
        {feature
          ? `${feature} is under construction and will be available in a future release.`
          : "This feature is under construction and will be available in a future release."}
      </p>
      <div
        style={{
          marginTop: "24px",
          padding: "6px 16px",
          backgroundColor: "var(--badge-bg)",
          color: "var(--badge-text)",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        EcoVoice Capstone · In Progress
      </div>
    </div>
  );
}
