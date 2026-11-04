import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!serverId)
      return res.status(400).json({ error: "Server ID Missing" });

    if (!channelId)
      return res.status(400).json({ error: "Channel ID Missing" });

    if (!content)
      return res.status(400).json({ error: "Content Missing" });

    const [member, channel] = await Promise.all([
      db.member.findFirst({
        where: {
          serverId: serverId as string,
          profileId: profile.id
        },
        include: {
          profile: true
        }
      }),
      db.channel.findFirst({
        where: {
          id: channelId as string,
          serverId: serverId as string
        },
        select: { id: true }
      })
    ]);

    if (!member)
      return res.status(404).json({ message: "Member not found" });

    if (!channel)
      return res.status(404).json({ message: "Channel not found" });

    const created = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id
      }
    });

    const message = {
      ...created,
      member
    };

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
