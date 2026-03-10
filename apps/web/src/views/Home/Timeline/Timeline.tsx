import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQueryOptions } from "../../../queries";
import styles from "./Timeline.module.css";

type Group = { id: string; name: string; createdAt: number };

/**
 * タイムライン（投稿一覧のみ）。
 * loader で ensureQueryData 済み → useSuspenseQuery でキャッシュから取得（同一 queryKey）。
 */
export function Timeline({ group }: { group: Group }) {
  const { data: postsData } = useSuspenseQuery(
    postsQueryOptions.list(group.id)
  );

  if (!postsData.items.length) {
    return <p className={styles.empty}>まだ投稿がありません</p>;
  }

  return (
    <ul className={styles.list} aria-label="投稿一覧">
      {postsData.items.map((post) => (
        <li key={post.id} className={styles.card}>
          {post.media?.[0] && (
            <img
              src={post.media[0].mediaUrl}
              alt=""
              className={styles.media}
            />
          )}
          <div className={styles.body}>
            {post.caption && (
              <p className={styles.caption}>{post.caption}</p>
            )}
            <p className={styles.meta}>
              {post.author.displayName ?? "不明"} · コメント {post.replyCount}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
