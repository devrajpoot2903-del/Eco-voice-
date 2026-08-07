import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import HealthStatus from "@/components/HealthStatus";

export const metadata: Metadata = {
  title: "Health",
  description: "EcoVoice Health — API status and system information.",
};

export default function HealthPage() {
  return (
    <div>
      <PageHeader
        title="Health"
        description="Real-time API status and system information for the EcoVoice capstone project."
      />
      <HealthStatus />
    </div>
  );
}
