"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Profile } from "@prisma/client";

export interface FriendItem {
  friendshipId: string;
  friend: Profile;
  createdAt: string;
}

export interface PendingRequest {
  friendshipId: string;
  sender?: Profile;
  receiver?: Profile;
  createdAt: string;
}

export interface FriendsResponse {
  friends: FriendItem[];
  incoming: PendingRequest[];
  outgoing: PendingRequest[];
}

export function useFriends() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<FriendsResponse>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await axios.get("/api/friends");
      return res.data;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (payload: {
      targetUserId?: string;
      targetEmail?: string;
      targetName?: string;
    }) => {
      const res = await axios.post("/api/friends", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    }
  });

  const handleRequest = useMutation({
    mutationFn: async ({
      friendshipId,
      action
    }: {
      friendshipId: string;
      action: "accept" | "decline";
    }) => {
      const res = await axios.patch("/api/friends", { friendshipId, action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    }
  });

  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const res = await axios.delete(`/api/friends?friendshipId=${friendshipId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    }
  });

  return {
    friends: data?.friends || [],
    incoming: data?.incoming || [],
    outgoing: data?.outgoing || [],
    isLoading,
    refetch,
    sendFriendRequest,
    handleRequest,
    removeFriend
  };
}
