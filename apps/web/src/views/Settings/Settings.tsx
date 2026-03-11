/**
 * 設定: グループ名の変更（1ユーザー1グループ前提）
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
import { queryKeys, groupsMutationOptions } from "../../queries";
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

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field name="group-name" required invalid={!!updateGroup.error}>
          <FieldLabel>グループ名</FieldLabel>
          <FieldInput
            placeholder="例: 田中家"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            disabled={updateGroup.isPending}
          />
          <FieldError error={updateGroup.error} />
        </Field>
        <div className={styles.actions}>
          <Link to="/" className={styles.cancelLink}>
            キャンセル
          </Link>
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
  );
}
