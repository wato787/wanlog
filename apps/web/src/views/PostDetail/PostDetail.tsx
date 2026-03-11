/**
 * 投稿詳細: 1件表示 + リプライ一覧・投稿・削除（本人のみ）
 */
import { useState } from "react";
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  authQueryOptions,
  postsQueryOptions,
  postsMutationOptions,
  repliesQueryOptions,
  repliesMutationOptions,
  queryKeys,
} from "../../queries";
import { Button, Field, FieldError } from "../../components";
import styles from "./PostDetail.module.css";

type PostDetailProps = { groupId: string; postId: string };

function formatReplyDate(createdAt: number): string {
  const d = new Date(createdAt * 1000);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostDetail({ groupId, postId }: PostDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");

  const { data: post } = useSuspenseQuery(
    postsQueryOptions.detail(groupId, postId)
  );
  const { data: me } = useQuery(authQueryOptions.me());
  const { data: repliesData } = useQuery(repliesQueryOptions.list(groupId, postId));

  const deletePost = useMutation({
    ...postsMutationOptions.delete(groupId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts(groupId) });
      navigate({ to: "/" });
    },
  });

  const createReply = useMutation({
    ...repliesMutationOptions.create(groupId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.postDetail(groupId, postId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts(groupId) });
      setReplyBody("");
    },
  });

  const deleteReply = useMutation({
    ...repliesMutationOptions.delete(groupId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.postDetail(groupId, postId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts(groupId) });
    },
  });

  const isOwner = me?.id != null && post?.userId === me.id;
  const replies = repliesData?.replies ?? [];

  const handleDeletePost = () => {
    if (!window.confirm("この投稿を削除しますか？")) return;
    deletePost.mutate();
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed || createReply.isPending) return;
    createReply.mutate(trimmed);
  };

  const handleDeleteReply = (replyId: string) => {
    if (!window.confirm("このコメントを削除しますか？")) return;
    deleteReply.mutate(replyId);
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
            コメント {replies.length}
          </p>
          {isOwner && (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDeletePost}
                disabled={deletePost.isPending}
              >
                {deletePost.isPending ? "削除中…" : "削除"}
              </Button>
            </div>
          )}
        </div>
      </article>

      <section className={styles.repliesSection} aria-label="コメント">
        <h2 className={styles.repliesHeading}>コメント</h2>

        <form className={styles.replyForm} onSubmit={handleSubmitReply}>
          <Field name="reply-body" invalid={!!createReply.error}>
            <textarea
              className={styles.replyInput}
              placeholder="コメントを追加…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={createReply.isPending}
              rows={2}
              aria-invalid={!!createReply.error}
            />
            <FieldError error={createReply.error} />
          </Field>
          <Button
            type="submit"
            variant="primary"
            disabled={createReply.isPending || !replyBody.trim()}
          >
            {createReply.isPending ? "送信中…" : "送信"}
          </Button>
        </form>

        <ul className={styles.replyList}>
          {replies.map((reply) => {
            const isReplyOwner = me?.id != null && reply.userId === me.id;
            return (
              <li key={reply.id} className={styles.replyItem}>
                <p className={styles.replyBody}>{reply.body}</p>
                <div className={styles.replyMeta}>
                  <span>{reply.author.displayName ?? "不明"}</span>
                  <span>{formatReplyDate(reply.createdAt)}</span>
                  {isReplyOwner && (
                    <button
                      type="button"
                      className={styles.replyDelete}
                      onClick={() => handleDeleteReply(reply.id)}
                      disabled={deleteReply.isPending}
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {replies.length === 0 && (
          <p className={styles.repliesEmpty}>まだコメントはありません</p>
        )}
      </section>
    </div>
  );
}
