import { queryOptions } from "@tanstack/react-query";
import { api, parseResponse } from "../lib/api";
import { queryKeys } from "./keys";

export const authQueryOptions = {
  me: () =>
    queryOptions({
      queryKey: queryKeys.authMe(),
      queryFn: async () => {
        const res = await api.auth.me.$get();
        if (!res.ok) throw new Error("Failed to fetch me");
        return parseResponse(res);
      },
      retry: false,
    }),
};
