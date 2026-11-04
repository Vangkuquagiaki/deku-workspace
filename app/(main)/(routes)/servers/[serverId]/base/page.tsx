import { LarkBaseView, MainTab } from "@/components/lark/lark-base-view";

interface ServerBasePageProps {
  params: {
    serverId: string;
  };
  searchParams?: {
    tab?: MainTab;
  };
}

export default function ServerBasePage({ params, searchParams }: ServerBasePageProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <LarkBaseView serverId={params.serverId} initialTab={searchParams?.tab || "today"} />
    </div>
  );
}
