import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { groupsQueryOptions } from "../../queries";
import { Settings } from "../../views/Settings/Settings";

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length === 0) {
      throw redirect({ to: "/onboarding" });
    }
    return { group: data.groups[0] };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { group } = useRouteContext({ from: "/_authenticated/settings" });
  if (!group) return null;
  return <Settings group={group} />;
}
