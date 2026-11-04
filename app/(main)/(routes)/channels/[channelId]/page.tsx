import React from "react";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { DmSidebar } from "@/components/dm/dm-sidebar";
import { FriendsView } from "@/components/friends/friends-view";

interface ChannelsPageProps {
  params: {
    channelId: string;
  };
}

export default async function ChannelsPage({ params }: ChannelsPageProps) {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  // Get suggested profiles (other profiles in the database)
  const suggestedProfiles = await db.profile.findMany({
    where: {
      id: {
        not: profile.id
      }
    },
    take: 10,
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="h-full flex overflow-hidden">
      <DmSidebar currentProfile={profile} />
      <FriendsView
        currentProfile={profile}
        suggestedProfiles={suggestedProfiles}
      />
    </div>
  );
}
