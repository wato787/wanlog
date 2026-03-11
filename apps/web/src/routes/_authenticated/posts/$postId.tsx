import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { groupsQueryOptions, postsQueryOptions } from "../../../queries";
import { PostDetail } from "../../../views/PostDetail/PostDetail";

export const Route = createFileRoute("/_authenticated/posts/$postId")({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length === 0) {
      throw redirect({ to: "/onboarding" });
    }
    return { group: data.groups[0], postId: params.postId };
  },
  loader: async ({ context, params }) => {
    if (!context.group) return;
    await context.queryClient.ensureQueryData(
      postsQueryOptions.detail(context.group.id, params.postId)
    );
  },
  component: PostDetailPage,
});

function PostDetailPage() {
  const { group, postId } = useRouteContext({ from: "/_authenticated/posts/$postId" });
  if (!group || !postId) return null;
  return <PostDetail groupId={group.id} postId={postId} />;
}
