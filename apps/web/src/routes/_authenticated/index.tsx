import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { queryKeys } from "../../queries";
import { groupsQueryOptions } from "../../queries";
import styles from "./index.module.css";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.fetchQuery(groupsQueryOptions.list());
    if (data.groups.length === 0) {
      throw redirect({ to: "/onboarding" as "/onboarding" });
    }
    return {};
  },
  component: HomePage,
});

function HomePage() {
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await api.auth.logout.$post();
    queryClient.invalidateQueries({ queryKey: queryKeys.auth });
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>わんログ</h1>
      <p>ホーム</p>
      <button type="button" className={styles.logoutButton} onClick={handleLogout}>
        ログアウト
      </button>
    </div>
  );
}
