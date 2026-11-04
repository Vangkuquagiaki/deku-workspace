import { MeetingDetailView } from "@/components/meeting/meeting-detail-view";

interface ServerMeetingDetailPageProps {
  params: {
    serverId: string;
    id: string;
  };
}

export default function ServerMeetingDetailPage({ params }: ServerMeetingDetailPageProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <MeetingDetailView serverId={params.serverId} meetingId={params.id} />
    </div>
  );
}

