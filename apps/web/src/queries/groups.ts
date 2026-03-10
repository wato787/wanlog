import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

export const groupsQueryOptions = {
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
