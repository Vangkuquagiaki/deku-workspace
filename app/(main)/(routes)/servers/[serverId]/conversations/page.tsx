import { redirect } from "next/navigation";

export default function ServerConversationsRedirectPage({
  params
}: {
  params: { serverId: string };
}) {
  return redirect(`/servers/${params.serverId}`);
}

