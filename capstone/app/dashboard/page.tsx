import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "EcoVoice Dashboard — overview of your tasks and activity.",
};

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your voice tasks, recent activity, and productivity metrics."
      />
      <ComingSoon feature="Dashboard" />
    </div>
  );
}
