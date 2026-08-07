import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Tasks",
  description: "EcoVoice Tasks — create and manage your voice-driven tasks.",
};

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Create, update, and manage your tasks using voice commands or manual input."
      />
      <ComingSoon feature="Task Management" />
    </div>
  );
}
