import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface TypingUser {
  memberId: string;
  name: string;
  timestamp: number;
}

export const useChatTyping = (chatId: string, currentMemberId?: string) => {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const typingKey = `chat:${chatId}:typing`;
    const stopTypingKey = `chat:${chatId}:stop-typing`;

    const handleTyping = ({
      memberId,
      name
    }: {
      memberId: string;
      name: string;
    }) => {
      if (memberId === currentMemberId) return;

      setTypingUsers((prev) => {
        const filtered = prev.filter((user) => user.memberId !== memberId);
        return [...filtered, { memberId, name, timestamp: Date.now() }];
      });
    };

    const handleStopTyping = ({ memberId }: { memberId: string }) => {
      setTypingUsers((prev) =>
        prev.filter((user) => user.memberId !== memberId)
      );
    };

    socket.on(typingKey, handleTyping);
    socket.on(stopTypingKey, handleStopTyping);

    // Auto cleanup expired typing state after 3.5s
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        if (prev.length === 0) return prev;
        const filtered = prev.filter((user) => now - user.timestamp < 3500);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 1500);

    return () => {
      socket.off(typingKey, handleTyping);
      socket.off(stopTypingKey, handleStopTyping);
      clearInterval(interval);
    };
  }, [socket, chatId, currentMemberId]);

  return { typingUsers };
};
