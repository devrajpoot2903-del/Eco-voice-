import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "EcoVoice",
    template: "%s | EcoVoice",
  },
  description:
    "EcoVoice — a voice-first task management application. Capstone architecture built with Next.js for FlyRank.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
          }}
        >
          <Sidebar />
          <main
            style={{
              flex: 1,
              padding: "40px 48px",
              overflowY: "auto",
              backgroundColor: "var(--background)",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
