/**
 * 初回ログイン時: グループ作成のみ
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Field,
  FieldLabel,
  FieldError,
  FieldInput,
} from "../../components";
import { queryKeys, groupsMutationOptions } from "../../queries";
import styles from "./Onboarding.module.css";

export function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");

  const createGroup = useMutation({
    ...groupsMutationOptions.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      navigate({ to: "/" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup.mutate(groupName);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>わんログ</h1>
        <p className={styles.lead}>
          まず、グループ（家族）の名前を決めましょう。
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Field name="group-name" required invalid={!!createGroup.error}>
            <FieldLabel>グループ名</FieldLabel>
            <FieldInput
              placeholder="例: 田中家、わが家"
              value={groupName}
              onValueChange={setGroupName}
              disabled={createGroup.isPending}
            />
            <FieldError error={createGroup.error} />
          </Field>
          <Button
            type="submit"
            variant="primary"
            disabled={createGroup.isPending}
          >
            {createGroup.isPending ? "作成中…" : "はじめる"}
          </Button>
        </form>
      </div>
    </div>
  );
}
