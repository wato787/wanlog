import { useEffect } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { postsQueryOptions, type PostListItem } from "../../../queries";
import { useInView } from "../../../hooks/useInView";
import styles from "./Timeline.module.css";

type Group = { id: string; name: string; createdAt: number };

const OPTIONS = postsQueryOptions.listInfinite;

/**
 * タイムライン（投稿一覧）。無限スクロール — 下端が見えたら自動で fetchNextPage。
 * TanStack Query 公式例（useInView + useEffect）に準拠。
 */
export function Timeline({ group }: { group: Group }) {
  const { ref, inView } = useInView({ rootMargin: "200px" });
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery(OPTIONS(group.id));

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data.pages.flatMap((p): PostListItem[] => p.items);

  if (!items.length) {
    return <p className={styles.empty}>まだ投稿がありません</p>;
  }

  return (
    <>
      <ul className={styles.list} aria-label="投稿一覧">
        {items.map((post) => (
          <li key={post.id} className={styles.card}>
            <Link to="/posts/$postId" params={{ postId: post.id }} className={styles.cardLink}>
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
            </Link>
          </li>
        ))}
      </ul>
      {/* 下端センチネル: ここが画面に入ったら fetchNextPage（公式例と同じパターン） */}
      {hasNextPage ? (
        <div ref={ref} className={styles.sentinel} aria-hidden>
          {isFetchingNextPage && (
            <p className={styles.loadingMore}>読み込み中…</p>
          )}
        </div>
      ) : null}
    </>
  );
}
