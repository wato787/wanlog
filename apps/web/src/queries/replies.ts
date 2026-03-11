import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

export type ReplyItem = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: number;
  author: { displayName: string; avatarUrl: string | null };
};

export const repliesQueryOptions = {
  list: (groupId: string, postId: string) =>
    queryOptions({
      queryKey: [...queryKeys.postDetail(groupId, postId), "replies"] as const,
      queryFn: async () => {
        const res = await api.groups[":groupId"].posts[":postId"].replies.$get({
          param: { groupId, postId },
        });
        if (!res.ok) throw new Error("Failed to fetch replies");
        const data = await parseResponse(res);
        return data as { replies: ReplyItem[] };
      },
    }),
};

export const repliesMutationOptions = {
  create: (groupId: string, postId: string) => ({
    mutationKey: [...queryKeys.posts(groupId), "reply", postId] as const,
    mutationFn: async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error("コメントを入力してください");
      const res = await api.groups[":groupId"].posts[":postId"].replies.$post({
        param: { groupId, postId },
        json: { body: trimmed },
      });
      if (!res.ok) throw new Error("コメントの投稿に失敗しました");
      return parseResponse(res);
    },
  }),
  delete: (groupId: string, postId: string) => ({
    mutationKey: [...queryKeys.posts(groupId), "reply", postId, "delete"] as const,
    mutationFn: async (replyId: string) => {
      const res = await api.groups[":groupId"].posts[":postId"].replies[":replyId"].$delete({
        param: { groupId, postId, replyId },
      });
      if (!res.ok) throw new Error("コメントの削除に失敗しました");
      return parseResponse(res);
    },
  }),
};
