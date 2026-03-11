import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { groupsQueryOptions } from "../../../queries";
import { PostCreate } from "../../../views/PostCreate/PostCreate";

export const Route = createFileRoute("/_authenticated/posts/new")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length === 0) {
      throw redirect({ to: "/onboarding" });
    }
    return { group: data.groups[0] };
  },
  component: PostCreatePage,
});

function PostCreatePage() {
  const { group } = useRouteContext({ from: "/_authenticated/posts/new" });
  if (!group) return null;
  return <PostCreate group={group} />;
}
