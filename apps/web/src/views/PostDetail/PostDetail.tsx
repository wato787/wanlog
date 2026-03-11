/**
 * 投稿詳細: 1件表示（パーマリンク）。本人は削除可能。
 */
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { authQueryOptions, postsQueryOptions, postsMutationOptions, queryKeys } from "../../queries";
import { Button } from "../../components";
import styles from "./PostDetail.module.css";

type PostDetailProps = { groupId: string; postId: string };

export function PostDetail({ groupId, postId }: PostDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: post } = useSuspenseQuery(
    postsQueryOptions.detail(groupId, postId)
  );
  const { data: me } = useQuery(authQueryOptions.me());
  const deletePost = useMutation({
    ...postsMutationOptions.delete(groupId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts(groupId) });
      navigate({ to: "/" });
    },
  });

  const isOwner = me?.id != null && post?.userId === me.id;

  const handleDelete = () => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    deletePost.mutate();
  };

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
          {isOwner && (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                disabled={deletePost.isPending}
              >
                {deletePost.isPending ? "削除中…" : "削除"}
              </Button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
