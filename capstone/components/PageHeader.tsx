interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div
      style={{
        marginBottom: "32px",
        paddingBottom: "24px",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <h1
        style={{
          margin: "0 0 8px 0",
          fontSize: "28px",
          fontWeight: "700",
          color: "var(--foreground)",
          lineHeight: "1.2",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          color: "var(--muted)",
          lineHeight: "1.5",
        }}
      >
        {description}
      </p>
    </div>
  );
}
