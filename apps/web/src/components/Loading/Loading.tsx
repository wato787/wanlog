import { Progress } from "@base-ui/react/progress";
import styles from "./Loading.module.css";

/**
 * Suspense の fallback や任意のローディング表示用。
 * Base UI Progress（indeterminate）でアクセシビリティを確保しつつ、円形スピナーを表示する。
 */
export function Loading() {
  return (
    <Progress.Root
      value={null}
      className={styles.root}
      aria-label="読み込み中"
    >
      <div className={styles.spinner} aria-hidden />
    </Progress.Root>
  );
}
