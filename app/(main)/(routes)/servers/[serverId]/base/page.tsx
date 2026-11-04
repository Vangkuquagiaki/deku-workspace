import { LarkBaseView } from "@/components/lark/lark-base-view";

interface ServerBasePageProps {
  params: {
    serverId: string;
  };
  searchParams?: {
    tab?: "tasks" | "org" | "me" | "bulletin" | "leave" | "directory" | "audit" | "threads";
  };
}

export default function ServerBasePage({ params, searchParams }: ServerBasePageProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <LarkBaseView serverId={params.serverId} initialTab={searchParams?.tab || "tasks"} />
    </div>
  );
}

