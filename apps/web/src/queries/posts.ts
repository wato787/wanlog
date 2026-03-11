import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

const POSTS_PAGE_LIMIT = 20;

export type PostListItem = {
  id: string;
  caption: string | null;
  media: { id: string; mediaUrl: string; mediaType: string; order: number }[];
  author: { displayName: string; avatarUrl: string | null };
  replyCount: number;
};

export const postsQueryOptions = {
  list: (groupId: string, opts?: { cursor?: string; limit?: number }) =>
    queryOptions({
      queryKey: queryKeys.postList(groupId, opts?.cursor),
      queryFn: async () => {
        const res = await api.groups[":groupId"].posts.$get({
          param: { groupId },
          query: {
            cursor: opts?.cursor,
            limit: opts?.limit != null ? String(opts.limit) : undefined,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch posts");
        return parseResponse(res);
      },
    }),
  listInfinite: (groupId: string) => ({
    queryKey: queryKeys.postListInfinite(groupId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const res = await api.groups[":groupId"].posts.$get({
        param: { groupId },
        query: {
          cursor: pageParam,
          limit: String(POSTS_PAGE_LIMIT),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await parseResponse(res);
      return data as { items: PostListItem[]; nextCursor?: string };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: { nextCursor?: string }) =>
      lastPage.nextCursor ?? undefined,
  }),
  detail: (groupId: string, postId: string) =>
    queryOptions({
      queryKey: queryKeys.postDetail(groupId, postId),
      queryFn: async () => {
        const res = await api.groups[":groupId"].posts[":postId"].$get({
          param: { groupId, postId },
        });
        if (!res.ok) throw new Error("Failed to fetch post");
        return parseResponse(res);
      },
    }),
};

export type CreatePostPayload = {
  caption?: string;
  takenAt?: number;
  media: { key: string; mediaType: "photo" | "video" }[];
};

export const postsMutationOptions = {
  create: (groupId: string) => ({
    mutationKey: [...queryKeys.posts(groupId), "create"] as const,
    mutationFn: async (payload: CreatePostPayload) => {
      const res = await api.groups[":groupId"].posts.$post({
        param: { groupId },
        json: payload,
      });
      if (!res.ok) throw new Error("投稿に失敗しました");
      return parseResponse(res);
    },
  }),
  delete: (groupId: string, postId: string) => ({
    mutationKey: [...queryKeys.posts(groupId), "delete", postId] as const,
    mutationFn: async () => {
      const res = await api.groups[":groupId"].posts[":postId"].$delete({
        param: { groupId, postId },
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      return parseResponse(res);
    },
  }),
};
