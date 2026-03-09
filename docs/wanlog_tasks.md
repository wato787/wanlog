# 🐾 わんログ タスク一覧（MVP）

凡例: `[ ]` 未着手 / `[x]` 完了 / `[-]` 進行中

---

## Phase 1. 開発環境構築

### 1-1. リポジトリ初期化
- [x] GitHubリポジトリ作成
- [x] `.gitignore`設定（bun / node_modules / wrangler / .env）

### 1-2. mise設定
- [x] `.mise.toml`作成（bunのバージョン固定）

### 1-3. monorepo構成
- [x] ルート`package.json`作成（bun workspaces設定）
- [x] `apps/web` / `apps/api` / `packages/types` ディレクトリ作成

### 1-4. apps/api 初期化
- [x] Hono + Cloudflare Workers セットアップ（`create-hono`）
- [x] `wrangler.toml`設定
- [x] D1 / R2 バインディング設定

### 1-5. apps/web 初期化
- [x] React + Vite セットアップ
- [x] CSS Modules 動作確認

### 1-6. packages/types 初期化
- [x] `package.json`作成
- [x] 共有型定義の初期ファイル作成（`index.ts`）

### 1-7. コード品質ツール
- [x] oxlint導入・`.oxlintrc.json`設定
- [x] oxfmt導入・設定
- [x] `tsconfig.json`設定（tsgo対応）
- [x] ルートに`biome.json`または各設定ファイル配置

### 1-8. vitest設定
- [x] `apps/api`にvitest設定
- [x] `apps/web`にvitest設定

### 1-9. Drizzle設定
- [x] `apps/api`にdrizzle / drizzle-kit導入
- [x] `drizzle.config.ts`作成
- [x] ローカルD1との接続確認（`wrangler d1`）

### 1-10. Cloudflare Pages設定
- [x] `apps/web`のビルド設定（`vite.config.ts`）
- [ ] Cloudflare Pagesプロジェクト作成（ダッシュボードで作成。Git 連携時: build `bun run build` / output `dist`。または `mise run deploy:web` でアップロード）

---

## Phase 2. DBスキーマ & マイグレーション

### 2-1. Drizzleスキーマ定義
- [x] `users`テーブル定義
- [x] `groups`テーブル定義
- [x] `group_members`テーブル定義
- [x] `dogs`テーブル定義
- [x] `posts`テーブル定義
- [x] `post_media`テーブル定義
- [x] `replies`テーブル定義
- [x] `invitations`テーブル定義

### 2-2. マイグレーション
- [x] `drizzle-kit generate`でマイグレーションファイル生成
- [x] ローカルD1にマイグレーション適用確認
- [ ] 本番D1にマイグレーション適用確認（本番DB作成後 `wrangler d1 migrations apply wanlog-db --remote`）

---

## Phase 3. 認証（LINE OAuth + JWT）

### 3-1. LINE Developersの設定
- [ ] LINE Developersコンソールでチャネル作成
- [ ] Callback URLの設定
- [ ] `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET`取得

### 3-2. 環境変数設定
- [x] `.dev.vars`にローカル用の環境変数設定（`.dev.vars.example` を追加）
- [ ] Cloudflare WorkersにSecrets設定（本番）

### 3-3. 認証APIの実装
- [x] `GET /auth/line` — LINE認証URLへのリダイレクト
- [x] `GET /auth/line/callback` — codeをトークンに交換・ユーザー作成・JWT発行・Cookie設定・フロントへリダイレクト
- [x] `POST /auth/logout` — CookieのJWT削除
- [x] `GET /auth/me` — ログインユーザー情報取得

### 3-4. JWTミドルウェア
- [x] HonoのJWT検証ミドルウェア実装（`requireAuth`）
- [x] 認証が必要なルートに適用（`/auth/me`）

### 3-5. フロント側の認証
- [ ] LINEログインボタンの実装
- [ ] コールバックページの実装（`/auth/callback`）
- [ ] 認証状態のグローバル管理（Context or Zustand）
- [ ] 未ログイン時のリダイレクト処理

---

## Phase 4. グループ・招待

### 4-1. グループAPI
- [x] `POST /groups` — グループ作成
- [x] `GET /groups/:groupId` — グループ情報取得
- [x] `PATCH /groups/:groupId` — グループ名変更
- [x] `GET /groups/:groupId/members` — メンバー一覧
- [x] `DELETE /groups/:groupId/members/:userId` — メンバー削除

### 4-2. 招待API
- [x] `POST /groups/:groupId/invitations` — 招待トークン発行
- [x] `GET /invitations/:token` — トークン確認（有効・無効・期限切れ）
- [x] `POST /invitations/:token/join` — グループ参加

### 4-3. フロント側（犬プロフィール作成画面）
- [ ] 初回ログイン判定（グループ未所属チェック）
- [ ] 犬プロフィール作成フォーム（名前・犬種・誕生日・アイコン）
- [ ] 送信時にグループ・犬を同時作成

### 4-4. フロント側（招待受け取り画面）
- [ ] トークン確認・状態表示（有効 / 無効 / 期限切れ）
- [ ] 未ログイン時はLINEログイン後に自動参加
- [ ] ログイン済み時は「グループに参加する」ボタン

---

## Phase 5. ファイルアップロード（R2）

### 5-1. presigned URL API
- [x] `POST /uploads/presigned-url` — 複数ファイル対応のpresigned URL発行
- [x] R2バケット作成・CORS設定（cors-policy.example.json 参照、手動で aws s3api put-bucket-cors）

### 5-2. フロント側アップロード処理
- [ ] presigned URLへのPUTアップロード実装
- [ ] 複数ファイルの並列アップロード処理
- [ ] アップロード進捗表示

---

## Phase 6. 投稿

### 6-1. 投稿API
- [x] `POST /groups/:groupId/posts` — 投稿作成（post_mediaも同時作成）
- [x] `GET /groups/:groupId/posts` — タイムライン取得（cursor-based pagination）
- [x] `GET /groups/:groupId/posts/:postId` — 投稿詳細（post_media含む）
- [x] `DELETE /groups/:groupId/posts/:postId` — 投稿削除（post_mediaも削除）

### 6-2. フロント側（投稿作成画面）
- [ ] 複数枚の写真・動画選択UI
- [ ] 選択メディアのプレビュー表示
- [ ] キャプション入力
- [ ] 撮影日入力（デフォルト: 今日）
- [ ] 投稿フロー: presigned URL取得 → R2アップロード → POST /posts

### 6-3. フロント側（ホーム・タイムライン画面）
- [ ] 投稿カード実装（アバター・名前・撮影日・キャプション・メディア・リプライ数）
- [ ] メディアのカルーセル表示（複数枚）
- [ ] 動画サムネイル＋再生アイコン
- [ ] 無限スクロール（Intersection Observer）
- [ ] 右下にFAB（投稿ボタン）

### 6-4. フロント側（投稿詳細画面）
- [ ] メディアの大きな表示（カルーセル）
- [ ] キャプション・撮影日表示
- [ ] 自分の投稿の削除ボタン

---

## Phase 7. リプライ

### 7-1. リプライAPI
- [x] `GET /groups/:groupId/posts/:postId/replies` — リプライ一覧
- [x] `POST /groups/:groupId/posts/:postId/replies` — リプライ投稿
- [x] `DELETE /groups/:groupId/posts/:postId/replies/:replyId` — リプライ削除

### 7-2. フロント側（投稿詳細画面）
- [ ] リプライ一覧表示
- [ ] リプライ入力欄（画面下部固定）
- [ ] 自分のリプライの削除ボタン

---

## Phase 8. 犬プロフィール・設定画面

### 8-1. 犬API
- [x] `GET /groups/:groupId/dogs` — 犬一覧
- [x] `POST /groups/:groupId/dogs` — 犬登録
- [x] `PATCH /groups/:groupId/dogs/:dogId` — 犬プロフィール更新

### 8-2. フロント側（設定画面）
- [ ] 犬プロフィール編集フォーム
- [ ] メンバー一覧表示
- [ ] 招待リンク発行・URLコピー
- [ ] ログアウトボタン

---

## Phase 9. 仕上げ・デプロイ

### 9-1. UI/UX
- [ ] モバイルファーストのレスポンシブ確認
- [ ] ローディング状態の実装（スケルトンUI等）
- [ ] エラー状態の実装（トースト通知等）
- [ ] 空状態の実装（投稿0件時など）

### 9-2. セキュリティ確認
- [ ] 他グループのリソースへのアクセス制御確認
- [ ] 招待トークンの期限切れ・使用済みチェック確認
- [ ] JWT有効期限切れ時のハンドリング確認

### 9-3. デプロイ
- [ ] 本番D1・R2・Workers設定
- [ ] Cloudflare Pagesデプロイ設定（GitHub連携）
- [ ] 本番環境での動作確認

### 9-4. ドメイン設定
- [ ] `wanlog.app` / `api.wanlog.app` のDNS設定
- [ ] Cookie `Domain=.wanlog.app` の動作確認
