import { createFileRoute, redirect } from "@tanstack/react-router";
import { Onboarding } from "../../views/Onboarding/Onboarding";
import { groupsQueryOptions } from "../../queries";

export const Route = createFileRoute("/_authenticated/onboarding")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length > 0) {
      throw redirect({ to: "/" });
    }
    return {};
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  return <Onboarding />;
}
