import { useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useVoiceState, VoiceParticipant } from "@/hooks/use-voice-state";

export function useVoiceSocket(serverId: string) {
  const { socket } = useSocket();
  const { addParticipant, removeParticipant, setParticipantMute, setParticipantDeafen } =
    useVoiceState();

  useEffect(() => {
    if (!socket || !serverId) return;

    const onJoin = ({
      channelId,
      member
    }: {
      channelId: string;
      member: VoiceParticipant;
    }) => {
      addParticipant(channelId, member);
    };

    const onLeave = ({
      channelId,
      memberId
    }: {
      channelId: string;
      memberId: string;
    }) => {
      removeParticipant(channelId, memberId);
    };

    const onState = ({
      channelId,
      memberId,
      micMuted,
      deafened
    }: {
      channelId: string;
      memberId: string;
      micMuted?: boolean;
      deafened?: boolean;
    }) => {
      if (typeof micMuted === "boolean") {
        setParticipantMute(channelId, memberId, micMuted);
      }
      if (typeof deafened === "boolean") {
        setParticipantDeafen(channelId, memberId, deafened);
      }
    };

    socket.on(`voice:${serverId}:join`, onJoin);
    socket.on(`voice:${serverId}:leave`, onLeave);
    socket.on(`voice:${serverId}:state`, onState);

    return () => {
      socket.off(`voice:${serverId}:join`, onJoin);
      socket.off(`voice:${serverId}:leave`, onLeave);
      socket.off(`voice:${serverId}:state`, onState);
    };
  }, [socket, serverId, addParticipant, removeParticipant, setParticipantMute, setParticipantDeafen]);
}
