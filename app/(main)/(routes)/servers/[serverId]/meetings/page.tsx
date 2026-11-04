import { MeetingsPageView } from "@/components/meeting/meetings-page-view";

interface ServerMeetingsPageProps {
  params: {
    serverId: string;
  };
}

export default function ServerMeetingsPage({ params }: ServerMeetingsPageProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <MeetingsPageView serverId={params.serverId} />
    </div>
  );
}

