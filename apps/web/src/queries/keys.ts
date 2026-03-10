/**
 * TanStack Query の queryKey を一元管理
 * invalidateQueries / prefetch で利用する
 */
export const queryKeys = {
  auth: ["auth"] as const,
  authMe: () => [...queryKeys.auth, "me"] as const,

  groups: ["groups"] as const,
  groupDetail: (groupId: string) => [...queryKeys.groups, "detail", groupId] as const,
  groupMembers: (groupId: string) => [...queryKeys.groups, "members", groupId] as const,

  posts: (groupId: string) => ["groups", groupId, "posts"] as const,
  postList: (groupId: string, cursor?: string) =>
    [...queryKeys.posts(groupId), "list", cursor ?? "initial"] as const,
  postDetail: (groupId: string, postId: string) =>
    [...queryKeys.posts(groupId), "detail", postId] as const,
};
