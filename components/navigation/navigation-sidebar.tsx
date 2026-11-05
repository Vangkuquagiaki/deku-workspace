import React from "react";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

import { NavigationAction } from "@/components/navigation/navigation-action";
import { NavigationHome } from "@/components/navigation/navigation-home";
import { NavigationMeetings } from "@/components/navigation/navigation-meetings";
import { NavigationBase } from "@/components/navigation/navigation-base";
import { NavigationDownload } from "@/components/navigation/navigation-download";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "@/components/navigation/navigation-item";
import { ModeToggle } from "@/components/mode-toggle";

export async function NavigationSidebar() {
  const profile = await currentProfile();

  if (!profile) return redirect("/");

  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile.id
        }
      }
    }
  });

  return (
    <div className="space-y-3 flex flex-col h-full items-center text-primary w-full dark:bg-[#1e1f22] bg-[#e3e5e8] py-3">
      <NavigationHome />
      <NavigationMeetings />
      <NavigationBase />
      <NavigationDownload />
      <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700/60 rounded-md w-8 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-2">
            <NavigationItem
              id={server.id}
              imageUrl={server.imageUrl}
              name={server.name}
            />
          </div>
        ))}
        <div className="mb-2">
          <NavigationAction />
        </div>
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-[48px] w-[48px]"
            }
          }}
        />
      </div>
    </div>
  );
}
