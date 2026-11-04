"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import "@livekit/components-styles";
import { LiveKitRoom } from "@livekit/components-react";
import { DiscordVideoConference } from "@/components/livekit/discord-conference";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
  userOverride?: {
    id?: string;
    name?: string;
    imageUrl?: string;
  };
}

// In-memory token cache to guarantee instant connection and eliminate connection spinners
const livekitTokenCache = new Map<string, { token: string; serverUrl: string; ts: number }>();

export function MediaRoom({
  chatId,
  video,
  audio,
  onDisconnected,
  isPiP = false,
  userOverride,
}: MediaRoomProps) {
  const { user } = useUser();
  const [token, setToken] = useState<string>(() => {
    // Check initial cache
    const cacheKey = `${chatId}_${userOverride?.name || user?.username || "default"}`;
    const cached = livekitTokenCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 3 * 3600 * 1000) {
      return cached.token;
    }
    return "";
  });
  const [error, setError] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState(
    process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://deku-p77u1a3n.livekit.cloud"
  );
  const [retryCount, setRetryCount] = useState(0);
  const [slowLoading, setSlowLoading] = useState(false);

  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();

  const connectVoice = useVoiceState((s) => s.connectVoice);
  const disconnectVoice = useVoiceState((s) => s.disconnectVoice);
  const removeParticipant = useVoiceState((s) => s.removeParticipant);

  // Stable fallback guest ID if unauthenticated or Clerk is still loading
  const [guestId] = useState(() => {
    if (typeof window !== "undefined") {
      let stored = sessionStorage.getItem("meet_guest_id");
      if (!stored) {
        stored = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        sessionStorage.setItem("meet_guest_id", stored);
      }
      return stored;
    }
    return `guest_${Date.now()}`;
  });

  const effectiveUserId = userOverride?.id || user?.id || guestId;
  const effectiveUserName = useMemo(() => {
    return (
      userOverride?.name?.trim() ||
      (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") ||
      user?.username ||
      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      user?.id ||
      "Thành viên"
    );
  }, [userOverride?.name, user?.firstName, user?.lastName, user?.username, user?.emailAddresses, user?.id]);

  const effectiveUserImageUrl = userOverride?.imageUrl || user?.imageUrl || "";
  const serverId = (params?.serverId as string) || "direct";

  // Dedicated token fetch effect with abort timeout (never blocked by socket or voice state updates)
  useEffect(() => {
    let isMounted = true;
    setError(null);
    setToken("");
    setSlowLoading(false);

    const cacheKey = `${chatId}_${effectiveUserName}`;
    const cached = livekitTokenCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 3 * 3600 * 1000 && retryCount === 0) {
      setLivekitUrl(cached.serverUrl);
      setToken(cached.token);
      return;
    }

    const slowTimer = setTimeout(() => {
      if (isMounted) setSlowLoading(true);
    }, 4000);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const response = await fetch(
          `/api/livekit?room=${encodeURIComponent(chatId)}&username=${encodeURIComponent(effectiveUserName)}&name=${encodeURIComponent(effectiveUserName)}&imageUrl=${encodeURIComponent(effectiveUserImageUrl)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        clearTimeout(slowTimer);

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok || data.error) {
          setError(data.error || "Failed to connect to media room");
          return;
        }

        if (data.serverUrl) {
          setLivekitUrl(data.serverUrl);
        }

        if (data.token) {
          livekitTokenCache.set(cacheKey, {
            token: data.token,
            serverUrl: data.serverUrl || livekitUrl,
            ts: Date.now(),
          });
          setToken(data.token);
        } else {
          setError("No token received from media service");
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        clearTimeout(slowTimer);
        if (!isMounted) return;
        if (err.name === "AbortError") {
          setError("Máy chủ phản hồi chậm do khởi động lạnh. Vui lòng nhấn Thử kết nối lại bên dưới.");
        } else {
          console.error("[MediaRoom] Token fetch error:", err);
          setError("Error connecting to LiveKit voice/video service");
        }
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(slowTimer);
    };
  }, [chatId, effectiveUserName, effectiveUserImageUrl, retryCount]);

  // Voice state / socket sync effect
  useEffect(() => {
    if (!effectiveUserId) return;

    const userPrefs = useUserPreferences.getState();
    const memberObj = {
      id: effectiveUserId,
      name: effectiveUserName,
      imageUrl: effectiveUserImageUrl,
      micMuted: userPrefs.micMuted,
      deafened: userPrefs.deafened,
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
        member: memberObj,
      });
    }

    return () => {
      const currentConnected = useVoiceState.getState().connectedChannelId;
      if (currentConnected !== chatId) {
        removeParticipant(chatId, effectiveUserId);
        removeParticipant(chatId, effectiveUserName);
        disconnectVoice(effectiveUserId);
        if (socket && params?.serverId) {
          socket.emit("voice:leave", {
            serverId: params.serverId,
            channelId: chatId,
            memberId: effectiveUserId,
          });
        }
      }
    };
  }, [
    effectiveUserId,
    effectiveUserName,
    effectiveUserImageUrl,
    serverId,
    chatId,
    video,
    socket,
    params?.serverId,
    connectVoice,
    disconnectVoice,
    removeParticipant,
  ]);

  const handleDisconnected = useCallback(() => {
    if (effectiveUserId) {
      removeParticipant(chatId, effectiveUserId);
      removeParticipant(chatId, effectiveUserName);
    }
    disconnectVoice(effectiveUserId);
    if (socket && params?.serverId && effectiveUserId) {
      socket.emit("voice:leave", {
        serverId: params.serverId,
        channelId: chatId,
        memberId: effectiveUserId,
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
          query: { video: undefined },
        },
        { skipNull: true }
      );
      router.push(url);
    } else if (params?.serverId) {
      router.push(`/servers/${params.serverId}`);
    }
  }, [
    disconnectVoice,
    socket,
    params?.serverId,
    effectiveUserId,
    effectiveUserName,
    chatId,
    onDisconnected,
    searchParams,
    pathname,
    router,
    removeParticipant,
  ]);

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
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Thử kết nối lại</span>
        </button>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center p-6 text-center">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin my-4" />
        <p className="text-xs text-zinc-400 font-medium">
          Đang thiết lập kết nối phòng họp bảo mật nội bộ...
        </p>
        {slowLoading && (
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center gap-1.5 transition animate-in fade-in"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Kết nối đang chậm? Nhấn thử lại</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={video}
      audio={audio}
      token={token}
      connect={true}
      serverUrl={livekitUrl}
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
