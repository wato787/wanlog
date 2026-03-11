/**
 * 設定: グループ名の変更・ログアウト（1ユーザー1グループ前提）
 * セクション分け・カード・余白・アニメーションで階層を明確に。
 */
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Field,
  FieldLabel,
  FieldError,
  FieldInput,
} from "../../components";
import { queryKeys, groupsMutationOptions, authMutationOptions } from "../../queries";
import styles from "./Settings.module.css";

type Group = { id: string; name: string; createdAt: number };

export function Settings({ group }: { group: Group }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);

  const updateGroup = useMutation({
    ...groupsMutationOptions.update(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      navigate({ to: "/" });
    },
  });

  const logout = useMutation({
    ...authMutationOptions.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth });
      navigate({ to: "/login" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === group.name) {
      navigate({ to: "/" });
      return;
    }
    updateGroup.mutate(name);
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} aria-label="戻る">
          ←
        </Link>
        <h1 className={styles.title}>設定</h1>
      </header>

      <section aria-labelledby="settings-group-heading">
        <h2 id="settings-group-heading" className={styles.sectionLabel}>
          グループ
        </h2>
        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <Field name="group-name" required invalid={!!updateGroup.error}>
              <FieldLabel>グループ名</FieldLabel>
              <FieldInput
                placeholder="例: 田中家"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                disabled={updateGroup.isPending}
              />
              <FieldError error={updateGroup.error} />
            </Field>
            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                disabled={updateGroup.isPending || name.trim() === ""}
              >
                {updateGroup.isPending ? "保存中…" : "保存"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section
        className={styles.logoutSection}
        aria-labelledby="settings-account-heading"
      >
        <h2 id="settings-account-heading" className={styles.logoutLabel}>
          アカウント
        </h2>
        <div className={styles.logoutCard}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? "ログアウト中…" : "ログアウト"}
          </button>
        </div>
      </section>
    </div>
  );
}
