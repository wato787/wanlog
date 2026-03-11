import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

export const groupsQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.groupsList(),
      queryFn: async () => {
        const res = await api.groups.$get();
        if (!res.ok) throw new Error("Failed to fetch groups");
        return parseResponse(res);
      },
    }),
  detail: (groupId: string) =>
    queryOptions({
      queryKey: queryKeys.groupDetail(groupId),
      queryFn: async () => {
        const res = await api.groups[":groupId"].$get({ param: { groupId } });
        if (!res.ok) throw new Error("Failed to fetch group");
        return parseResponse(res);
      },
    }),
  members: (groupId: string) =>
    queryOptions({
      queryKey: queryKeys.groupMembers(groupId),
      queryFn: async () => {
        const res = await api.groups[":groupId"].members.$get({ param: { groupId } });
        if (!res.ok) throw new Error("Failed to fetch members");
        return parseResponse(res);
      },
    }),
};

export const groupsMutationOptions = {
  create: () => ({
    mutationKey: [...queryKeys.groups, "create"] as const,
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("グループ名を入力してください");
      const res = await api.groups.$post({ json: { name: trimmed } });
      if (!res.ok) throw new Error("グループの作成に失敗しました");
      return parseResponse(res);
    },
  }),
  update: (groupId: string) => ({
    mutationKey: [...queryKeys.groups, "update", groupId] as const,
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("グループ名を入力してください");
      const res = await api.groups[":groupId"].$patch({
        param: { groupId },
        json: { name: trimmed },
      });
      if (!res.ok) throw new Error("グループ名の変更に失敗しました");
      return parseResponse(res);
    },
  }),
};
