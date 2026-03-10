/**
 * ホーム: ヘッダー + タイムライン
 */
import { Suspense } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { Loading } from "../../components";
import { Timeline } from "./Timeline/Timeline";
import type { RouterContext } from "../../routes/__root";
import styles from "./Home.module.css";

export function Home() {
  const { group } = useRouteContext({ from: "/_authenticated/" }) as RouterContext;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>わんログ</h1>
      </header>
      {group ? (
        <Suspense fallback={<Loading />}>
          <Timeline group={group} />
        </Suspense>
      ) : null}
    </div>
  );
}
