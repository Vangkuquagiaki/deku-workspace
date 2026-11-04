import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";

import { NextApiResponseServerIo } from "@/types";

export const config = {
  api: {
    bodyParser: false
  }
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path,
      // @ts-ignore
      addTrailingSlash: false
    });

    io.on("connection", (socket) => {
      socket.on("chat:typing", ({ chatId, memberId, name }) => {
        socket.broadcast.emit(`chat:${chatId}:typing`, { memberId, name });
      });

      socket.on("chat:stop-typing", ({ chatId, memberId }) => {
        socket.broadcast.emit(`chat:${chatId}:stop-typing`, { memberId });
      });

      socket.on("chat:reaction", (data) => {
        io.emit(`chat:${data.chatId}:reaction`, data);
      });

      socket.on("chat:soundboard", ({ chatId, soundId, senderName }) => {
        io.emit(`chat:${chatId}:soundboard`, { soundId, senderName });
      });

      // Track active voice channel per socket connection to prevent ghost / duplicate room presences
      const socketVoiceMap = new Map<string, { serverId: string; channelId: string; memberId: string }>();

      // Voice Channel participants sync
      socket.on("voice:join", ({ serverId, channelId, member }) => {
        const memberId = member?.id || member?.name;
        const prev = socketVoiceMap.get(socket.id);
        if (prev && (prev.channelId !== channelId || prev.serverId !== serverId)) {
          io.emit(`voice:${prev.serverId}:leave`, { channelId: prev.channelId, memberId: prev.memberId });
        }

        socketVoiceMap.set(socket.id, { serverId, channelId, memberId });
        io.emit(`voice:${serverId}:join`, { channelId, member });
      });

      socket.on("voice:leave", ({ serverId, channelId, memberId }) => {
        socketVoiceMap.delete(socket.id);
        io.emit(`voice:${serverId}:leave`, { channelId, memberId });
      });

      socket.on("disconnect", () => {
        const prev = socketVoiceMap.get(socket.id);
        if (prev) {
          socketVoiceMap.delete(socket.id);
          io.emit(`voice:${prev.serverId}:leave`, { channelId: prev.channelId, memberId: prev.memberId });
        }
      });

      socket.on("voice:state", ({ serverId, channelId, memberId, micMuted, deafened }) => {
        io.emit(`voice:${serverId}:state`, { channelId, memberId, micMuted, deafened });
      });

      socket.on("voice:raise-hand", (data) => {
        io.emit("voice:raise-hand", data);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
