"use client";

import React, { useMemo, useEffect, useRef, useState, useReducer } from "react";
import {
  GridLayout,
  CarouselView,
  FocusLayoutContainer,
  FocusLayout,
  RoomAudioRenderer,
  ConnectionStateToast,
  ParticipantTile,
  TrackMutedIndicator,
  ConnectionQualityIndicator,
  useTracks,
  usePinnedTracks,
  LayoutContextProvider,
  useCreateLayoutContext,
  useMaybeLayoutContext,
  useMaybeTrackContext,
  useMaybeParticipantContext,
  ParticipantContext,
  TrackContext,
  useParticipantInfo,
  useIsSpeaking,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent, Track, Participant, ParticipantEvent } from "livekit-client";
import { isEqualTrackRef, isTrackReference, isWeb } from "@livekit/components-core";
import { useUser } from "@clerk/nextjs";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Monitor,
  PhoneOff,
  Loader2,
  Maximize2,
  Minimize2,
  Headphones,
  VolumeX,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useVoiceState } from "@/hooks/use-voice-state";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useSocket } from "@/components/providers/socket-provider";
import { useRaiseHand } from "@/hooks/use-raise-hand";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * Bulletproof VideoRenderer: directly attaches LiveKit MediaStreamTrack to HTML5 video element.
 * Guarantees autoplay and zero black-screen subscription timing issues.
 */
function DirectVideoRenderer({
  track,
  isScreenShare = false,
  className,
}: {
  track?: any;
  isScreenShare?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;

    try {
      track.attach(el);
      el.play().catch((err) => {
        // Autoplay policy warning
        console.warn("DirectVideoRenderer play error:", err);
      });
    } catch (err) {
      console.error("DirectVideoRenderer attach error:", err);
    }

    return () => {
      try {
        track.detach(el);
      } catch (err) {
        // ignore
      }
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        "w-full h-full",
        isScreenShare ? "object-contain bg-black" : "object-cover",
        className
      )}
    />
  );
}

/**
 * Custom Discord tile inner content:
 * Displays participant's real account avatar with green speaking glow when camera is off,
 * or the live camera/screen share video when on.
 */
function DiscordTileContent({
  trackRef: propTrackRef,
  participant: propParticipant,
}: {
  trackRef?: any;
  participant?: any;
} = {}) {
  const contextTrackRef = useMaybeTrackContext();
  const contextParticipant = useMaybeParticipantContext();
  const trackRef = propTrackRef ?? contextTrackRef;
  const participant = propParticipant ?? trackRef?.participant ?? contextParticipant;
  const layoutContext = useMaybeLayoutContext();

  const { user } = useUser();
  const { participants, setParticipantSpeaking, connectedChannelId } = useVoiceState();
  const isHandRaised = useRaiseHand(
    (s) =>
      !!(
        participant &&
        (s.raisedHands[participant.identity] ||
          (participant.name && s.raisedHands[participant.name]))
      )
  );

  // Force re-render on any participant track changes (published, unmuted, subscribed)
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!participant) return;

    const handleChange = () => forceUpdate();

    participant.on(ParticipantEvent.TrackPublished, handleChange);
    participant.on(ParticipantEvent.TrackUnpublished, handleChange);
    participant.on(ParticipantEvent.TrackSubscribed, handleChange);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleChange);
    participant.on(ParticipantEvent.TrackMuted, handleChange);
    participant.on(ParticipantEvent.TrackUnmuted, handleChange);
    participant.on(ParticipantEvent.LocalTrackPublished, handleChange);
    participant.on(ParticipantEvent.LocalTrackUnpublished, handleChange);

    return () => {
      participant.off(ParticipantEvent.TrackPublished, handleChange);
      participant.off(ParticipantEvent.TrackUnpublished, handleChange);
      participant.off(ParticipantEvent.TrackSubscribed, handleChange);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleChange);
      participant.off(ParticipantEvent.TrackMuted, handleChange);
      participant.off(ParticipantEvent.TrackUnmuted, handleChange);
      participant.off(ParticipantEvent.LocalTrackPublished, handleChange);
      participant.off(ParticipantEvent.LocalTrackUnpublished, handleChange);
    };
  }, [participant]);

  const userPrefs = useUserPreferences();
  const isSpeakingRaw = useIsSpeaking(participant);
  const isLocalUser = participant?.isLocal;
  const isMicMuted = Boolean(
    participant?.isMuted ||
    participant?.getTrack(Track.Source.Microphone)?.isMuted ||
    (isLocalUser && (userPrefs.micMuted || userPrefs.deafened))
  );
  const isSpeaking = Boolean(isSpeakingRaw && !isMicMuted);
  const { name, metadata } = useParticipantInfo({ participant });

  // Sync real LiveKit speaking detection to useVoiceState for sidebar
  useEffect(() => {
    if (participant?.isLocal && connectedChannelId && user?.id) {
      setParticipantSpeaking(connectedChannelId, user.id, isSpeaking);
    }
  }, [isSpeaking, participant?.isLocal, connectedChannelId, user?.id, setParticipantSpeaking]);

  // 1. Extract avatar URL from LiveKit token metadata or Clerk
  const avatarUrl = useMemo(() => {
    if (!participant) return "";
    let url = "";
    if (metadata) {
      try {
        const parsed = JSON.parse(metadata);
        if (parsed.avatarUrl || parsed.imageUrl) {
          url = parsed.avatarUrl || parsed.imageUrl;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!url && user) {
      if (
        participant.identity === user.id ||
        participant.identity === user.username ||
        participant.name === user.username ||
        name === user.fullName
      ) {
        url = user.imageUrl || "";
      }
    }

    if (!url && participants) {
      for (const list of Object.values(participants)) {
        const match = list.find(
          (p) =>
            p.id === participant.identity ||
            p.name === participant.name ||
            p.name === name
        );
        if (match?.imageUrl) {
          url = match.imageUrl;
          break;
        }
      }
    }

    return url;
  }, [metadata, participant, user, name, participants]);

  if (!participant) {
    return null;
  }

  const displayName =
    name ||
    participant.name ||
    participant.identity ||
    "Người tham gia";

  const source =
    trackRef?.source ??
    (trackRef?.publication?.source as Track.Source | undefined) ??
    Track.Source.Camera;

  const isScreenShare = source === Track.Source.ScreenShare;

  // Find the active video publication & underlying Track instance
  const publication =
    trackRef?.publication ??
    participant.getTrack(source) ??
    (isScreenShare
      ? participant.getTrack(Track.Source.ScreenShare)
      : participant.getTrack(Track.Source.Camera));

  const activeTrack =
    publication?.track ??
    trackRef?.track ??
    (isScreenShare
      ? participant.getTrack(Track.Source.ScreenShare)?.track
      : participant.getTrack(Track.Source.Camera)?.track);

  const isMuted = publication?.isMuted ?? false;

  const isVideoActive = isScreenShare
    ? Boolean(activeTrack && !isMuted) || Boolean(participant.isScreenShareEnabled && activeTrack)
    : Boolean(activeTrack && !isMuted) || Boolean(participant.isCameraEnabled && activeTrack);

  // Check pin/focus state
  const isPinned = Boolean(
    layoutContext?.pin?.state?.some((p: any) => {
      if (trackRef && p) {
        return isEqualTrackRef(trackRef, p);
      }
      return (
        p?.participant?.identity === participant?.identity &&
        (p?.source === source || p?.publication?.source === source)
      );
    })
  );

  const handleToggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!layoutContext?.pin?.dispatch) return;
    if (isPinned) {
      layoutContext.pin.dispatch({ msg: "clear_pin" });
    } else {
      layoutContext.pin.dispatch({
        msg: "set_pin",
        trackReference: trackRef || {
          participant,
          source,
          publication,
        },
      });
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#1e1f22] overflow-hidden select-none group">
      {/* Live Video (Camera or Screen Share) */}
      {isVideoActive && activeTrack ? (
        <div className="absolute inset-0 w-full h-full z-10">
          <DirectVideoRenderer
            track={activeTrack}
            isScreenShare={isScreenShare}
          />
        </div>
      ) : (
        /* Discord Avatar View (shown when camera is off) */
        <div className="relative flex flex-col items-center justify-center p-4">
          <div
            className={cn(
              "rounded-full transition-all duration-200 p-1 flex items-center justify-center relative",
              isSpeaking
                ? "ring-4 ring-emerald-500 shadow-[0_0_24px_rgba(35,165,90,0.85)] scale-105"
                : "ring-2 ring-zinc-700/50"
            )}
          >
            <Avatar className="h-20 w-20 md:h-28 md:w-28 rounded-full border-2 border-[#1e1f22] bg-[#2b2d31]">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                  className="object-cover h-full w-full"
                />
              ) : null}
              <AvatarFallback className="bg-[#5865f2] text-white font-bold text-2xl md:text-3xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Speaking active badge */}
            {isSpeaking && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#1e1f22] shadow">
                <Volume2 className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen share watermark badge */}
      {isScreenShare && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg border border-white/10">
          <Monitor className="h-4 w-4 text-indigo-400" />
          <span>Màn hình của {displayName}</span>
        </div>
      )}

      {/* Screen share LIVE 720p badge */}
      {isScreenShare && (
        <div className="absolute top-3 right-12 z-20 flex items-center gap-1.5 bg-rose-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold shadow-lg border border-rose-400/30 uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>TRỰC TIẾP</span>
        </div>
      )}

      {/* Hand Raised Banner */}
      {isHandRaised && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-amber-500/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce border border-amber-300/40 select-none">
          <span>✋</span>
          <span>Đang giơ tay</span>
        </div>
      )}

      {/* Bottom overlay: Participant Name & Status */}
      <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow max-w-[80%] border border-white/5">
        {isMicMuted ? (
          <TrackMutedIndicator
            source={Track.Source.Microphone}
            participant={participant}
            show="muted"
          />
        ) : isSpeaking ? (
          <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0 drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
        ) : (
          <Mic className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        )}
        <span className="truncate">{displayName}</span>
      </div>

      {/* Bottom-right: Connection Quality */}
      <div className="absolute bottom-2.5 right-2.5 z-20">
        <ConnectionQualityIndicator
          participant={participant}
          className="bg-black/70 backdrop-blur-md p-1 rounded-md"
        />
      </div>

      {/* Top-right: Maximize / Minimize Focus Toggle Button */}
      <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleToggleFocus}
          title={isPinned ? "Thu nhỏ về danh sách" : "Phóng to toàn khung hình"}
          className={cn(
            "p-1.5 rounded-lg text-white shadow-lg backdrop-blur-md transition-all cursor-pointer",
            isPinned
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-black/70 hover:bg-black/90 border border-white/10"
          )}
        >
          {isPinned ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Custom Participant Tile wrapper that injects DiscordTileContent
 */
export function DiscordParticipantTile({
  trackRef: propTrackRef,
  participant: propParticipant,
  source: propSource,
  publication: propPublication,
  className,
  ...props
}: any) {
  const contextTrackRef = useMaybeTrackContext();
  const contextParticipant = useMaybeParticipantContext();

  const trackRef = propTrackRef ?? contextTrackRef;
  const participant = propParticipant ?? trackRef?.participant ?? contextParticipant;

  if (!participant) {
    return null;
  }

  const source = propSource ?? trackRef?.source ?? Track.Source.Camera;
  const publication = propPublication ?? trackRef?.publication;

  return (
    <ParticipantTile
      trackRef={trackRef}
      participant={participant}
      source={source}
      publication={publication}
      className={cn("w-full h-full relative overflow-hidden", className)}
      {...props}
    >
      <TrackContext.Provider value={trackRef}>
        <ParticipantContext.Provider value={participant}>
          <DiscordTileContent trackRef={trackRef} participant={participant} />
        </ParticipantContext.Provider>
      </TrackContext.Provider>
    </ParticipantTile>
  );
}

/**
 * Custom VideoConference replacement matching Discord UI with real user avatars
 */
export function DiscordVideoConference({
  onLeave,
  isPiP = false,
}: {
  onLeave?: () => void;
  isPiP?: boolean;
} = {}) {
  const lastAutoFocusedScreenShareTrack = useRef<any>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = useMemo(() => {
    return tracks
      .filter(isTrackReference)
      .filter(
        (track) =>
          track.source === Track.Source.ScreenShare ||
          track.publication?.source === Track.Source.ScreenShare
      );
  }, [tracks]);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = useMemo(() => {
    return tracks.filter((track) => !isEqualTrackRef(track, focusTrack));
  }, [tracks, focusTrack]);

  // Auto-focus on active screen share when started
  useEffect(() => {
    const activeScreenShare = screenShareTracks[0];

    if (activeScreenShare && lastAutoFocusedScreenShareTrack.current === null) {
      layoutContext.pin.dispatch?.({
        msg: "set_pin",
        trackReference: activeScreenShare,
      });
      lastAutoFocusedScreenShareTrack.current = activeScreenShare;
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      screenShareTracks.length === 0
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastAutoFocusedScreenShareTrack.current = null;
    }
  }, [screenShareTracks, layoutContext.pin]);

  const { micMuted, deafened } = useUserPreferences();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { user } = useUser();
  const {
    connectedChannelId,
    connectedServerId,
    participants,
    removeParticipant,
    setParticipantMute,
    setParticipantDeafen,
    setParticipantSpeaking
  } = useVoiceState();
  const { socket } = useSocket();

  // Find simulated/invited participants in this channel that are not in LiveKit tracks
  const channelParticipants = connectedChannelId
    ? participants[connectedChannelId] || []
    : [];

  const virtualParticipants = useMemo(() => {
    return channelParticipants.filter((cp) => {
      const isLocal =
        cp.id === user?.id || (user?.fullName && cp.name?.includes(user.fullName));
      const hasLiveKitTrack = tracks.some(
        (t) =>
          t.participant.identity === cp.id ||
          t.participant.name === cp.name ||
          t.participant.identity === cp.name
      );
      return !isLocal && !hasLiveKitTrack;
    });
  }, [channelParticipants, user, tracks]);

  const totalGridCount = tracks.length + virtualParticipants.length;

  // Realistic voice activity simulation for invited attendees:
  // Randomly cycles speaking turns (e.g. speaking for 2.5s, then silent for 6s)
  useEffect(() => {
    if (virtualParticipants.length === 0 || !connectedChannelId) return;

    const interval = setInterval(() => {
      // Pick a random unmuted virtual participant to speak briefly
      const unmuted = virtualParticipants.filter((vp) => !vp.micMuted);
      if (unmuted.length === 0) return;

      const speaker = unmuted[Math.floor(Math.random() * unmuted.length)];
      setParticipantSpeaking(connectedChannelId, speaker.id, true);

      // Stop speaking after 2.5 - 3.5 seconds
      const speakDuration = 2500 + Math.random() * 1000;
      setTimeout(() => {
        setParticipantSpeaking(connectedChannelId, speaker.id, false);
      }, speakDuration);
    }, 6500);

    return () => clearInterval(interval);
  }, [virtualParticipants, connectedChannelId, setParticipantSpeaking]);

  // 1. Sync Microphone state with LiveKit local participant and channel store
  useEffect(() => {
    if (!localParticipant) return;
    const shouldEnable = !micMuted && !deafened;
    localParticipant.setMicrophoneEnabled(shouldEnable).catch((err) => {
      console.warn("LiveKit mic sync error:", err);
    });

    if (connectedChannelId && user?.id) {
      setParticipantMute(connectedChannelId, user.id, !shouldEnable);
      if (socket && connectedServerId) {
        socket.emit("voice:state", {
          serverId: connectedServerId,
          channelId: connectedChannelId,
          memberId: user.id,
          micMuted: !shouldEnable,
          deafened
        });
      }
    }
  }, [micMuted, deafened, localParticipant, connectedChannelId, connectedServerId, user?.id, socket, setParticipantMute]);

  // 2. Sync Deafen state with Room incoming audio (Không nghe nữa khi tắt tai nghe)
  useEffect(() => {
    if (!room) return;
    try {
      const roomAny = room as any;
      if (roomAny.remoteParticipants) {
        roomAny.remoteParticipants.forEach((remoteP: any) => {
          remoteP.audioTrackPublications?.forEach((pub: any) => {
            if (pub.track) {
              pub.track.setVolume?.(deafened ? 0 : 1);
            }
          });
        });
      }
    } catch (err) {
      console.warn("Failed to set remote audio volume:", err);
    }

    if (connectedChannelId && user?.id) {
      setParticipantDeafen(connectedChannelId, user.id, deafened);
      if (socket && connectedServerId) {
        socket.emit("voice:state", {
          serverId: connectedServerId,
          channelId: connectedChannelId,
          memberId: user.id,
          micMuted,
          deafened
        });
      }
    }
  }, [deafened, room, connectedChannelId, connectedServerId, user?.id, socket, setParticipantDeafen, micMuted]);

  return (
    <div className="lk-video-conference h-full w-full flex flex-col bg-[#111214]">
      {isWeb() && (
        <LayoutContextProvider value={layoutContext}>
          <div className="lk-video-conference-inner flex-1 relative flex flex-col overflow-hidden">
            {!focusTrack ? (
              /* Grid Layout Mode */
              <div className={cn(
                "flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-auto bg-[#111214]",
                isPiP ? "p-1.5" : "p-3 md:p-6"
              )}>
                <div
                  className={cn(
                    "w-full h-full max-h-full flex items-center justify-center",
                    totalGridCount === 1 && "max-w-4xl max-h-[75vh]",
                    totalGridCount === 2 && "grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 max-w-5xl",
                    totalGridCount >= 3 && totalGridCount <= 4 && "grid grid-cols-2 gap-2 md:gap-4 max-w-5xl",
                    totalGridCount > 4 && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 max-w-7xl"
                  )}
                >
                  {/* Real LiveKit Tracks */}
                  {tracks.map((track) => (
                    <div
                      key={
                        track.publication?.trackSid ||
                        `${track.participant.identity}_${track.source}`
                      }
                      className={cn(
                        "w-full h-full rounded-2xl overflow-hidden bg-[#1e1f22] border border-zinc-800 shadow-2xl relative flex items-center justify-center",
                        totalGridCount === 1
                          ? "aspect-video max-h-[72vh]"
                          : "aspect-video min-h-[160px]"
                      )}
                    >
                      <DiscordParticipantTile
                        trackRef={track}
                        participant={track.participant}
                        source={track.source}
                        publication={track.publication}
                      />
                    </div>
                  ))}

                  {/* Invited Room Members (Virtual / Simulated Attendees) */}
                  {virtualParticipants.map((vp) => (
                    <div
                      key={vp.id}
                      className={cn(
                        "w-full h-full rounded-2xl overflow-hidden bg-[#1e1f22] border shadow-2xl relative flex items-center justify-center group animate-in zoom-in-95 duration-200 transition-all",
                        vp.isSpeaking && !vp.micMuted
                          ? "border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                          : "border-zinc-800",
                        totalGridCount === 1
                          ? "aspect-video max-h-[72vh]"
                          : "aspect-video min-h-[160px]"
                      )}
                    >
                      {/* Center Avatar with Speaking Glow */}
                      <div className="flex flex-col items-center justify-center gap-2 select-none">
                        <div className="relative">
                          <Avatar
                            className={cn(
                              "h-20 w-20 md:h-24 md:w-24 transition-all duration-300 ring-4",
                              vp.isSpeaking && !vp.micMuted
                                ? "ring-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.7)] animate-pulse scale-105"
                                : vp.micMuted
                                ? "ring-zinc-800 opacity-70"
                                : "ring-zinc-700/60 opacity-90"
                            )}
                          >
                            <AvatarImage src={vp.imageUrl} className="object-cover" />
                            <AvatarFallback className="bg-zinc-800 text-white font-bold text-xl md:text-2xl">
                              {vp.name ? vp.name.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>

                          {vp.isSpeaking && !vp.micMuted && (
                            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#1e1f22] shadow-sm flex items-center justify-center">
                              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom-left: Name & Mic Status */}
                      <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-white max-w-[80%] border border-white/5">
                        {vp.micMuted ? (
                          <MicOff className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        ) : vp.isSpeaking ? (
                          <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
                        ) : (
                          <Mic className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span className="truncate">{vp.name}</span>
                      </div>

                      {/* Bottom-right: Connection Quality */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-end gap-0.5 bg-black/70 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/5">
                        <span className="h-1.5 w-0.5 rounded-full bg-emerald-400" />
                        <span className="h-2.5 w-0.5 rounded-full bg-emerald-400" />
                        <span className="h-3 w-0.5 rounded-full bg-emerald-400" />
                        <span className="h-4 w-0.5 rounded-full bg-emerald-400" />
                      </div>

                      {/* Top-right: Remove / Kick Button ("ai out thì trừ bớt ra") */}
                      <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playLeaveVoice();
                            if (connectedChannelId) {
                              removeParticipant(connectedChannelId, vp.id);
                              removeParticipant(connectedChannelId, vp.name);
                              if (socket && connectedServerId) {
                                socket.emit("voice:leave", {
                                  serverId: connectedServerId,
                                  channelId: connectedChannelId,
                                  memberId: vp.id,
                                });
                              }
                            }
                          }}
                          title="Mời rời phòng họp (Rời cuộc gọi)"
                          className="h-7 px-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-lg backdrop-blur-md transition cursor-pointer"
                        >
                          <PhoneOff className="h-3 w-3" />
                          <span className="hidden sm:inline">Mời rời</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {totalGridCount === 0 && (
                    <div className="text-zinc-400 text-sm flex flex-col items-center gap-2">
                      <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                        🎧
                      </div>
                      <p>Đang chờ các thành viên tham gia phòng họp...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Focused Layout Mode (Speaker or Screen Share maximized) */
              <div className="lk-focus-layout-wrapper flex-1 flex flex-col bg-[#111214] p-3 gap-3 min-h-0 overflow-hidden">
                {/* Primary Screen Share or Focused Speaker View */}
                <div className="flex-1 relative w-full h-full min-h-0 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black flex items-center justify-center">
                  <DiscordParticipantTile
                    trackRef={focusTrack}
                    participant={focusTrack.participant}
                    source={focusTrack.source}
                    publication={focusTrack.publication}
                  />
                </div>

                {/* Horizontal Participant Row below Screen Share */}
                {carouselTracks.length > 0 && (
                  <div className="h-28 md:h-36 shrink-0 w-full flex items-center justify-center gap-3 overflow-x-auto py-1">
                    {carouselTracks.map((t) => (
                      <div
                        key={
                          t.publication?.trackSid ||
                          `${t.participant.identity}_${t.source}`
                        }
                        className="h-full aspect-video rounded-xl overflow-hidden bg-[#1e1f22] border border-zinc-800 shadow-lg shrink-0 relative"
                      >
                        <DiscordParticipantTile
                          trackRef={t}
                          participant={t.participant}
                          source={t.source}
                          publication={t.publication}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DiscordConferenceControlBar onLeave={onLeave} isPiP={isPiP} />
          </div>
        </LayoutContextProvider>
      )}
      {/* Remote Audio: Rendered only when NOT deafened so incoming audio is silenced when deafened */}
      {!deafened && <RoomAudioRenderer />}
      <ConnectionStateToast />
    </div>
  );
}

/**
 * Dedicated Discord Call Control Bar with robust Camera, Screen Share, Mic and Deafen toggles
 */
function DiscordConferenceControlBar({ onLeave, isPiP = false }: { onLeave?: () => void; isPiP?: boolean }) {
  const {
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();

  const { micMuted, deafened, toggleMic, toggleDeafen } = useUserPreferences();
  const isMicActive = !micMuted && !deafened;

  const [cameraPending, setCameraPending] = useState(false);
  const [screenPending, setScreenPending] = useState(false);

  const toggleCamera = async () => {
    if (!localParticipant || cameraPending) return;
    setCameraPending(true);
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err: any) {
      console.error("Camera toggle error:", err);
      alert(
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Trình duyệt đang chặn Camera! Vui lòng nhấn vào biểu tượng Ổ khóa hoặc Camera trên thanh địa chỉ URL của trình duyệt để cho phép (Allow) Camera."
          : `Không thể mở camera: ${err?.message || "Lỗi thiết bị"}`
      );
    } finally {
      setCameraPending(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant || screenPending) return;
    setScreenPending(true);
    try {
      if (isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        // Attempt sharing with audio first; fallback to video-only if audio capture is unsupported
        try {
          await localParticipant.setScreenShareEnabled(true, { audio: true });
        } catch (audioErr) {
          console.warn("Screen share with audio failed, falling back to video only:", audioErr);
          await localParticipant.setScreenShareEnabled(true, { audio: false });
        }
      }
    } catch (err: any) {
      console.error("Screen share toggle error:", err);
      if (err?.name !== "AbortError" && err?.name !== "NotAllowedError") {
        alert(`Không thể chia sẻ màn hình: ${err?.message || "Lỗi thiết bị"}`);
      }
    } finally {
      setScreenPending(false);
    }
  };

  return (
    <div
      className={cn(
        "shrink-0 bg-[#1e1f22] border-t border-zinc-800/80 flex items-center justify-center z-30 shadow-2xl backdrop-blur-md select-none",
        isPiP ? "h-11 px-2 gap-1.5" : "h-16 px-4 gap-2.5"
      )}
    >
      {/* Microphone Toggle - Fully linked with UserControlBar and Channel List */}
      <button
        type="button"
        onClick={() => toggleMic()}
        title={isMicActive ? "Tắt Micro (Mute)" : "Bật Micro (Unmute)"}
        className={cn(
          "font-medium flex items-center gap-1.5 transition-all duration-150 shadow-sm cursor-pointer",
          isPiP ? "h-8 px-2.5 rounded-lg text-[11px]" : "h-10 px-4 rounded-xl text-xs",
          isMicActive
            ? "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 hover:text-white border border-white/5"
            : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-500/50"
        )}
      >
        {isMicActive ? (
          <Mic className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-emerald-400")} />
        ) : (
          <MicOff className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-white")} />
        )}
        <span className={isPiP ? "hidden" : "hidden sm:inline"}>
          {isMicActive ? "Tắt Mic" : "Bật Mic"}
        </span>
      </button>

      {/* Headphones / Deafen Toggle - Linked with UserControlBar */}
      <button
        type="button"
        onClick={() => toggleDeafen()}
        title={deafened ? "Bật Tai Nghe (Undeafen)" : "Tắt Tai Nghe (Deafen)"}
        className={cn(
          "font-medium flex items-center gap-1.5 transition-all duration-150 shadow-sm cursor-pointer",
          isPiP ? "h-8 px-2.5 rounded-lg text-[11px]" : "h-10 px-3.5 rounded-xl text-xs",
          deafened
            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-500/50"
            : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 hover:text-white border border-white/5"
        )}
      >
        {deafened ? (
          <VolumeX className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-white")} />
        ) : (
          <Headphones className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-zinc-300")} />
        )}
        <span className={isPiP ? "hidden" : "hidden sm:inline"}>
          {deafened ? "Bật Tai" : "Tắt Tai"}
        </span>
      </button>

      {/* Camera Toggle */}
      <button
        type="button"
        onClick={toggleCamera}
        disabled={cameraPending}
        title={isCameraEnabled ? "Tắt Camera (Stop Video)" : "Bật Camera (Start Video)"}
        className={cn(
          "font-medium flex items-center gap-1.5 transition-all duration-150 shadow-sm",
          isPiP ? "h-8 px-2.5 rounded-lg text-[11px]" : "h-10 px-4 rounded-xl text-xs",
          isCameraEnabled
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50"
            : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 hover:text-white border border-white/5"
        )}
      >
        {cameraPending ? (
          <Loader2 className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "animate-spin")} />
        ) : isCameraEnabled ? (
          <Video className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-white")} />
        ) : (
          <VideoOff className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-zinc-400")} />
        )}
        <span className={isPiP ? "hidden" : "hidden sm:inline"}>
          {isCameraEnabled ? "Tắt Camera" : "Bật Camera"}
        </span>
      </button>

      {/* Screen Share Toggle */}
      <button
        type="button"
        onClick={toggleScreenShare}
        disabled={screenPending}
        title={isScreenShareEnabled ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        className={cn(
          "font-medium flex items-center gap-1.5 transition-all duration-150 shadow-sm",
          isPiP ? "h-8 px-2.5 rounded-lg text-[11px]" : "h-10 px-4 rounded-xl text-xs",
          isScreenShareEnabled
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 ring-2 ring-indigo-500/50"
            : "bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 hover:text-white border border-white/5"
        )}
      >
        {screenPending ? (
          <Loader2 className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "animate-spin")} />
        ) : isScreenShareEnabled ? (
          <Monitor className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-white animate-pulse")} />
        ) : (
          <Monitor className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4", "text-zinc-400")} />
        )}
        <span className={isPiP ? "hidden" : "hidden sm:inline"}>
          {isScreenShareEnabled ? "Dừng chia sẻ" : "Chia sẻ"}
        </span>
      </button>

      {/* Disconnect Button */}
      {onLeave && (
        <button
          type="button"
          onClick={onLeave}
          title="Rời phòng họp (Disconnect)"
          className={cn(
            "font-semibold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all duration-150 ml-1",
            isPiP ? "h-8 px-2.5 rounded-lg text-[11px]" : "h-10 px-4 rounded-xl text-xs ml-1.5"
          )}
        >
          <PhoneOff className={cn(isPiP ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className={isPiP ? "hidden" : "hidden sm:inline"}>Rời phòng</span>
        </button>
      )}
    </div>
  );
}
