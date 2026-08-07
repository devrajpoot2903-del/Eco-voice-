import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "History",
  description: "EcoVoice History — view your past tasks and completed actions.",
};

export default function HistoryPage() {
  return (
    <div>
      <PageHeader
        title="History"
        description="Review your completed tasks, deleted items, and a full log of past voice activity."
      />
      <ComingSoon feature="Task History" />
    </div>
  );
}
