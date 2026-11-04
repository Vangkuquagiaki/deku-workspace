"use client";

import React, { useEffect, useState, useCallback } from "react";
import "@livekit/components-styles";
import { LiveKitRoom } from "@livekit/components-react";
import { DiscordVideoConference } from "@/components/livekit/discord-conference";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertCircle } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";

import { useSocket } from "@/components/providers/socket-provider";
import { useVoiceState } from "@/hooks/use-voice-state";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
  onDisconnected?: () => void;
  isPiP?: boolean;
}

export function MediaRoom({ chatId, video, audio, onDisconnected, isPiP = false }: MediaRoomProps) {
  const { user } = useUser();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();

  const connectVoice = useVoiceState((s) => s.connectVoice);
  const disconnectVoice = useVoiceState((s) => s.disconnectVoice);
  const removeParticipant = useVoiceState((s) => s.removeParticipant);

  const userId = user?.id;
  const userImageUrl = user?.imageUrl || "";
  const userName =
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    user?.id ||
    "User";

  const serverId = (params?.serverId as string) || "direct";

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const userPrefs = useUserPreferences.getState();
    const memberObj = {
      id: userId,
      name: userName,
      imageUrl: userImageUrl,
      micMuted: userPrefs.micMuted,
      deafened: userPrefs.deafened
    };

    connectVoice(
      serverId,
      chatId,
      video ? "Kênh Video" : "Kênh Thoại",
      memberObj
    );

    if (socket && params?.serverId) {
      socket.emit("voice:join", {
        serverId: params.serverId,
        channelId: chatId,
        member: memberObj
      });
    }

    (async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/livekit?room=${chatId}&username=${encodeURIComponent(userName)}&imageUrl=${encodeURIComponent(userImageUrl)}`
        );
        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || data.error) {
          setError(data.error || "Failed to connect to media room");
          return;
        }

        setToken(data.token);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Error connecting to LiveKit voice/video service");
      }
    })();

    return () => {
      isMounted = false;
      const currentConnected = useVoiceState.getState().connectedChannelId;
      // Only disconnect if user actually left this room in useVoiceState
      if (currentConnected !== chatId) {
        if (userId) {
          removeParticipant(chatId, userId);
          removeParticipant(chatId, userName);
        }
        disconnectVoice(userId);
        if (socket && params?.serverId && userId) {
          socket.emit("voice:leave", {
            serverId: params.serverId,
            channelId: chatId,
            memberId: userId
          });
        }
      }
    };
  }, [userId, userName, userImageUrl, serverId, chatId, video, socket, params?.serverId, connectVoice, disconnectVoice, removeParticipant]);

  const handleDisconnected = useCallback(() => {
    if (user?.id) {
      removeParticipant(chatId, user.id);
      removeParticipant(chatId, userName);
    }
    disconnectVoice(user?.id);
    if (socket && params?.serverId && user?.id) {
      socket.emit("voice:leave", {
        serverId: params.serverId,
        channelId: chatId,
        memberId: user.id
      });
    }

    setToken("");

    if (onDisconnected) {
      onDisconnected();
      return;
    }

    // Default exit navigation
    if (searchParams?.get("video")) {
      const url = qs.stringifyUrl(
        {
          url: pathname || "",
          query: { video: undefined }
        },
        { skipNull: true }
      );
      router.push(url);
    } else if (params?.serverId) {
      router.push(`/servers/${params.serverId}`);
    }
  }, [disconnectVoice, socket, params?.serverId, user?.id, chatId, onDisconnected, searchParams, pathname, router]);

  if (error) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
        <h3 className="font-semibold text-lg text-zinc-700 dark:text-zinc-200">
          Chưa thể kết nối Phòng Họp Trực Tuyến
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
          {error === "Server misconfigured"
            ? "Chưa cấu hình API keys LiveKit (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL) trong file .env."
            : error}
        </p>
      </div>
    );
  }

  if (token === "")
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin my-4" />
        <p className="text-xs text-zinc-400 font-medium">
          Đang thiết lập kết nối phòng họp bảo mật nội bộ...
        </p>
      </div>
    );

  return (
    <LiveKitRoom
      video={video}
      audio={audio}
      token={token}
      connect={true}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      onDisconnected={handleDisconnected}
      onError={(err) => console.error("LiveKit room error:", err)}
      onMediaDeviceFailure={(failure) => {
        console.warn("LiveKit media device failure:", failure);
      }}
    >
      <DiscordVideoConference onLeave={handleDisconnected} isPiP={isPiP} />
    </LiveKitRoom>
  );
}
