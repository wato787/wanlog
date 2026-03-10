/**
 * 未ログイン時に表示するログイン画面（LINE OAuth 入口）
 * LINE Login ボタンは公式ガイドラインに準拠:
 * https://developers.line.biz/en/docs/line-login/login-button/
 */
import { getApiBaseUrl } from "../../lib/client";
import styles from "./Login.module.css";

const LINE_LOGIN_PATH = "/auth/line";

export function Login() {
  const loginUrl = getApiBaseUrl() + LINE_LOGIN_PATH;

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <h1 className={styles.title}>わんログ</h1>
        <p className={styles.lead}>
          家族の愛犬の思い出を、ひとつに。
        </p>
        <a
          href={loginUrl}
          className={styles.lineButton}
          aria-label="LINEでログイン"
        >
          <span className={styles.lineButtonIcon} aria-hidden />
          LINEでログイン
        </a>
      </div>
    </div>
  );
}
