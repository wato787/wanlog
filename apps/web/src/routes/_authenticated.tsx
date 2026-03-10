import {
  createFileRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { authQueryOptions } from "../queries";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.fetchQuery(authQueryOptions.me());
      return {};
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
