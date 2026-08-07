import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Settings",
  description: "EcoVoice Settings — configure your preferences and application options.",
};

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your EcoVoice preferences, voice settings, and application options."
      />
      <ComingSoon feature="Settings" />
    </div>
  );
}
