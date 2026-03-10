import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router";
import { Login } from "../views/Login/Login";
import { authQueryOptions } from "../queries";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.fetchQuery(authQueryOptions.me());
      throw redirect({ to: "/" });
    } catch (e) {
      if (isRedirect(e)) throw e;
      return {};
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return <Login />;
}
