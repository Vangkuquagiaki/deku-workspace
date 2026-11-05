import { redirect } from "next/navigation";

export default function ServerChannelsRedirectPage({
  params
}: {
  params: { serverId: string };
}) {
  return redirect(`/servers/${params.serverId}`);
}
