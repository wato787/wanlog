/**
 * 投稿詳細: 1件表示（パーマリンク）
 */
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { postsQueryOptions } from "../../queries";
import styles from "./PostDetail.module.css";

type PostDetailProps = { groupId: string; postId: string };

export function PostDetail({ groupId, postId }: PostDetailProps) {
  const { data: post } = useSuspenseQuery(
    postsQueryOptions.detail(groupId, postId)
  );

  if (!post) {
    return <p className={styles.notFound}>投稿が見つかりません</p>;
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} aria-label="戻る">
          ←
        </Link>
      </header>

      <article className={styles.card}>
        {post.media && post.media.length > 0 && (
          <div className={styles.mediaList}>
            {post.media.map((m) =>
              m.mediaType === "video" ? (
                <div key={m.id} className={styles.mediaItem}>
                  <video src={m.mediaUrl} controls />
                </div>
              ) : (
                <div key={m.id} className={styles.mediaItem}>
                  <img src={m.mediaUrl} alt="" />
                </div>
              )
            )}
          </div>
        )}
        <div className={styles.body}>
          {post.caption && (
            <p className={styles.caption}>{post.caption}</p>
          )}
          <p className={styles.meta}>
            {post.author.displayName ?? "不明"}
            {" · "}
            コメント {post.replyCount ?? 0}
          </p>
        </div>
      </article>
    </div>
  );
}
