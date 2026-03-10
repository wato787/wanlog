import { createFileRoute, redirect } from "@tanstack/react-router";
import { groupsQueryOptions, postsQueryOptions } from "../../queries";
import { Home } from "../../views/Home/Home";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length === 0) {
      throw redirect({ to: "/onboarding" as "/onboarding" });
    }
    return { group: data.groups[0] };
  },
  loader: async ({ context }) => {
    if (!context.group) return;
    await context.queryClient.ensureQueryData(
      postsQueryOptions.list(context.group.id)
    );
  },
  component: HomePage,
});

function HomePage() {
  return <Home />;
}
