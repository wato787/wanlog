import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

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
