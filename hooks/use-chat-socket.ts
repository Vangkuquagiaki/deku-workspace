import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Member, Message, Profile } from "@prisma/client";

import { useSocket } from "@/components/providers/socket-provider";
import { sounds } from "@/lib/sounds";
import { useUserPreferences } from "@/hooks/use-user-preferences";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
  currentMemberId?: string;
};

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
  reactions?: { emoji: string; memberIds: string[] }[];
};

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
  currentMemberId
}: ChatSocketProps) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    socket.on(updateKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message;
              }
              return item;
            })
          };
        });

        return {
          ...oldData,
          pages: newData
        };
      });
    });

    socket.on(addKey, (message: MessageWithMemberWithProfile) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [
              {
                items: [message]
              }
            ]
          };
        }

        // Check if real message already exists
        const alreadyExists = oldData.pages.some((page: any) =>
          page.items.some((item: any) => item.id === message.id)
        );
        if (alreadyExists) return oldData;

        // Try replacing an optimistic message
        let replaced = false;
        const newData = oldData.pages.map((page: any, pageIndex: number) => {
          if (pageIndex !== 0) return page;

          const items = page.items.map((item: any) => {
            if (
              !replaced &&
              item.isOptimistic &&
              item.memberId === message.memberId &&
              item.content === message.content
            ) {
              replaced = true;
              return message;
            }
            return item;
          });

          return {
            ...page,
            items
          };
        });

        if (replaced) {
          return {
            ...oldData,
            pages: newData
          };
        }

        // Otherwise prepend to the first page
        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items]
        };

        // Play authentic Discord chime for messages from others
        if (message.memberId !== currentMemberId && useUserPreferences.getState().soundEnabled) {
          sounds.playMessageReceived();
        }

        return {
          ...oldData,
          pages: newData
        };
      });
    });

    const reactionKey = `${queryKey}:reaction`;
    const handleReaction = ({
      messageId,
      emoji,
      memberId
    }: {
      messageId: string;
      emoji: string;
      memberId: string;
    }) => {
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        const newData = oldData.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: any) => {
            if (item.id !== messageId) return item;

            const existingReactions = item.reactions || [];
            const existingEmojiIndex = existingReactions.findIndex(
              (r: any) => r.emoji === emoji
            );

            let updatedReactions;
            if (existingEmojiIndex > -1) {
              const target = existingReactions[existingEmojiIndex];
              const hasReacted = target.memberIds.includes(memberId);
              const updatedMemberIds = hasReacted
                ? target.memberIds.filter((id: string) => id !== memberId)
                : [...target.memberIds, memberId];

              if (updatedMemberIds.length === 0) {
                updatedReactions = existingReactions.filter(
                  (_: any, i: number) => i !== existingEmojiIndex
                );
              } else {
                updatedReactions = [...existingReactions];
                updatedReactions[existingEmojiIndex] = {
                  ...target,
                  memberIds: updatedMemberIds
                };
              }
            } else {
              updatedReactions = [
                ...existingReactions,
                { emoji, memberIds: [memberId] }
              ];
            }

            return {
              ...item,
              reactions: updatedReactions
            };
          })
        }));

        return { ...oldData, pages: newData };
      });
    };

    const chatId = addKey.split(":")[1];
    const soundboardKey = `chat:${chatId}:soundboard`;

    const handleSoundboard = (data: { soundId: string; senderName?: string }) => {
      if (useUserPreferences.getState().soundEnabled) {
        sounds.playSoundboard(data.soundId);
      }
    };

    socket.on(reactionKey, handleReaction);
    socket.on(soundboardKey, handleSoundboard);

    return () => {
      socket.off(addKey);
      socket.off(updateKey);
      socket.off(reactionKey, handleReaction);
      socket.off(soundboardKey, handleSoundboard);
    };
  }, [queryClient, addKey, queryKey, socket, updateKey, currentMemberId]);
};
