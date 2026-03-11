/**
 * 投稿作成: X風 — テキスト優先、任意でメディア追加
 */
import { useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Field,
  FieldError,
} from "../../components";
import { uploadFiles } from "../../lib/upload";
import { queryKeys, postsMutationOptions } from "../../queries";
import styles from "./PostCreate.module.css";

const MAX_LENGTH = 280;

type Group = { id: string; name: string; createdAt: number };

export function PostCreate({ group }: { group: Group }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  const createPost = useMutation({
    ...postsMutationOptions.create(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts(group.id) });
      navigate({ to: "/" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setFiles(Array.from(list));
    setSubmitError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) {
      setSubmitError(new Error("何か書くか、写真・動画を追加してください"));
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setSubmitError(new Error(`${MAX_LENGTH}文字以内で入力してください`));
      return;
    }
    try {
      const media =
        files.length > 0 ? await uploadFiles(files) : [];
      createPost.mutate(
        {
          caption: trimmed || undefined,
          media,
        },
        {
          onError: (err) =>
            setSubmitError(err instanceof Error ? err : new Error("投稿に失敗しました")),
        }
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err : new Error("アップロードに失敗しました"));
    }
  };

  const displayError = submitError ?? createPost.error;
  const length = text.length;
  const overLimit = length > MAX_LENGTH;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} aria-label="戻る">
          ←
        </Link>
        <h1 className={styles.title}>投稿</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.composer}>
          <Field name="post-text" invalid={!!displayError}>
            <textarea
              placeholder="何が起きている？"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH + 100}
              rows={3}
              aria-invalid={!!displayError}
            />
            <div className={styles.footer}>
              <div className={styles.footerRow}>
                <button
                  type="button"
                  className={styles.addMedia}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="写真・動画を追加"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </button>
                <span
                  className={
                    overLimit
                      ? styles.charCountOver
                      : length > MAX_LENGTH * 0.9
                        ? styles.charCountWarn
                        : styles.charCount
                  }
                  aria-live="polite"
                >
                  {length} / {MAX_LENGTH}
                </span>
              </div>
              <FieldError error={displayError} />
            </div>
          </Field>

          {files.length > 0 && (
            <div className={styles.previewList}>
              {files.map((file, i) => (
                <div key={i} className={styles.previewItem}>
                  {file.type.startsWith("video/") ? (
                    <video src={URL.createObjectURL(file)} muted />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="" />
                  )}
                  <button
                    type="button"
                    className={styles.removeMedia}
                    onClick={() => removeFile(i)}
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            multiple
            className={styles.fileInput}
            onChange={handleFileChange}
          />
        </div>

        <div className={styles.actions}>
          <Link to="/" className={styles.cancelLink}>
            キャンセル
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={
              createPost.isPending ||
              (text.trim().length === 0 && files.length === 0) ||
              overLimit
            }
          >
            {createPost.isPending ? "投稿中…" : "投稿"}
          </Button>
        </div>
      </form>
    </div>
  );
}
