import { redirect } from "next/navigation";

export default function ChannelsRedirectPage() {
  return redirect("/channels/@me");
}

