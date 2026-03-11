# 🐾 わんログ 要件定義書

**Ver 1.2 ／ 2025年3月**

---

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | わんログ |
| コンセプト | 家族だけのプライベートな空間で、愛犬の成長を写真・動画で記録・振り返れるWebアプリ |
| ターゲットユーザー | 犬を飼っている家族（複数人でグループ共有） |
| 参考サービス | みてね（子ども向け家族アルバムアプリ）の犬版 |
| 公開範囲 | 招待制・プライベートのみ（一般公開なし） |
| 主な操作環境 | スマートフォン（モバイルファースト） |

---

## 2. スコープ

### 2-1. MVPに含む機能

| 機能 | 内容 |
|---|---|
| LINEログイン | LINEアカウントでログイン |
| 初回セットアップ | グループ名を入力して作成、または招待リンクで参加 |
| 写真・動画の投稿 | 複数枚の画像・動画とキャプションを同時に投稿できる |
| タイムライン閲覧 | 家族の投稿を時系列で表示（無限スクロール） |
| リプライ | 投稿に対して返信コメントできる |
| 招待リンク | URLを共有するだけで家族をグループに招待 |
| 設定 | メンバー一覧・招待リンク発行・ログアウト |

### 2-2. MVP以降に追加する機能候補

| 機能 | 備考 |
|---|---|
| 犬プロフィール | 設定画面から任意登録。dogsテーブルは設計済み |
| いいね機能 | |
| アルバム画面 | 犬タグづけとセットで実装 |
| 投稿への犬タグづけ | 複数匹対応。post_dogsテーブルを追加 |
| 体重・食事管理 | |
| ワクチン・病院記録 | |
| お散歩記録 | |
| トリミング予約・記録 | |

---

## 3. 概念モデル

Group（家族グループ）を中心に、メンバー・犬・投稿がひもづく構造。

```
Group（家族グループ）
  ├── group_members → User（家族メンバー）
  ├── Dog（犬、複数匹OK）
  └── Post（投稿）
        ├── PostMedia（複数枚対応）
        ├── Reply
        └── （Like ※MVP以降）
```

---

## 4. データ設計（テーブル定義）

### 4-1. users

| カラム | 説明 |
|---|---|
| id | 主キー |
| line_id | LINEユーザーID |
| display_name | LINEから取得した表示名 |
| avatar_url | LINEアイコンURL |
| created_at | 作成日時 |

### 4-2. groups

| カラム | 説明 |
|---|---|
| id | 主キー |
| name | グループ名（例：田中家） |
| created_at | 作成日時 |

### 4-3. group_members

| カラム | 説明 |
|---|---|
| group_id | groupへの外部キー |
| user_id | userへの外部キー |
| role | owner / member |
| joined_at | 参加日時 |

### 4-4. dogs

| カラム | 説明 |
|---|---|
| id | 主キー |
| group_id | groupへの外部キー |
| name | 犬の名前 |
| breed | 犬種 |
| birthday | 誕生日 |
| icon_url | アイコン画像URL（R2保存） |
| created_at | 作成日時 |

### 4-5. posts

| カラム | 説明 |
|---|---|
| id | 主キー |
| group_id | groupへの外部キー |
| user_id | 投稿したuserへの外部キー |
| caption | 投稿時に画像・動画と同時に入力するコメント（任意） |
| taken_at | 撮影日（任意） |
| created_at | 投稿日時 |

### 4-6. post_media

| カラム | 説明 |
|---|---|
| id | 主キー |
| post_id | postへの外部キー |
| media_url | R2上のファイルURL |
| media_type | photo / video |
| order | 表示順 |
| created_at | 作成日時 |

### 4-7. replies

| カラム | 説明 |
|---|---|
| id | 主キー |
| post_id | postへの外部キー |
| user_id | 投稿したuserへの外部キー |
| body | リプライ本文 |
| created_at | 投稿日時 |

### 4-8. invitations

| カラム | 説明 |
|---|---|
| id | 主キー |
| group_id | 招待先groupへの外部キー |
| token | URLトークン（ランダム文字列） |
| expires_at | 有効期限（例：72時間） |
| used_at | 使用日時（NULLなら未使用） |
| created_at | 作成日時 |

---

## 5. 認証・招待設計

### 5-1. ログイン

- LINEログイン（OAuth 2.0）のみ
- 自前のパスワード管理なし
- display_name・avatar_urlはLINEから自動取得

### 5-2. 家族招待フロー

| ステップ | 内容 |
|---|---|
| Step 1 | オーナーが設定画面で「招待リンク生成」ボタンを押す |
| Step 2 | 期限付きトークンを発行（72時間有効） |
| Step 3 | URLをLINEでそのまま家族に送る |
| Step 4 | 受け取った家族がURLを開く |
| Step 5 | LINEログイン → 自動でグループに参加 |

---

## 6. 画面設計（MVP）

| # | 画面名 | 概要 |
|---|---|---|
| 1 | ログイン画面 | LINEログインボタンのみ |
| 2 | 初回セットアップ | グループ作成 or 招待リンクで参加 |
| 3 | ホーム（タイムライン） | 家族の投稿を時系列で表示 |
| 4 | 投稿作成画面 | 写真/動画複数選択 ＋ キャプション ＋ 撮影日入力 |
| 5 | 投稿詳細画面 | メディアを大きく表示 ＋ リプライ一覧 |
| 6 | 招待受け取り画面 | リンクを開いた家族がグループ参加 |
| 7 | 設定画面 | メンバー一覧・招待リンク発行・ログアウト |

### 画面詳細

#### 1. ログイン画面
- アプリのロゴ・キャッチコピー
- LINEログインボタン

#### 2. 初回セットアップ
- グループ未所属のユーザーのみ表示
- 「グループを作る」→ グループ名を入力して作成（ownerとして参加）
- 「招待リンクを持っている」→ 招待リンクのURLを入力 or 招待URLを直接開いて参加

#### 3. ホーム（タイムライン）
- 投稿カードの表示項目: 投稿者アバター・名前、撮影日、キャプション、メディア（複数枚はカルーセル）、動画の場合はサムネイル＋再生アイコン、リプライ数
- 無限スクロール（cursor-based pagination）
- 右下にFAB（投稿ボタン）

#### 4. 投稿作成画面
- 複数枚の写真・動画を選択可能
- キャプション入力（任意）
- 撮影日入力（任意・デフォルトは今日）
- 「投稿する」ボタン → presigned URLでR2に直接アップロード後、POST /groups/:groupId/posts

#### 5. 投稿詳細画面
- 上部: メディアを大きく表示（複数枚はカルーセル）
- 下部: キャプション・撮影日・リプライ一覧
- リプライ入力欄を画面下部に固定
- 自分の投稿・リプライは削除可能

#### 6. 招待受け取り画面
- トークンを検証して有効・無効・期限切れを表示
- 未ログインの場合 → LINEログイン後に自動参加
- ログイン済みの場合 → 「グループに参加する」ボタン

#### 7. 設定画面
- メンバー一覧表示
- 招待リンク発行（URLをコピー）
- ログアウト

---

## 7. 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + Vite |
| スタイリング | CSS Modules |
| バックエンド | Hono（Cloudflare Workers） |
| データベース | Cloudflare D1（SQLite）、ORM: Drizzle |
| ファイルストレージ | Cloudflare R2（画像・動画） |
| 認証 | LINEログイン（OAuth 2.0）、セッション: JWT |
| フロントホスティング | Cloudflare Pages |

> 全てCloudflareで統一。個人利用規模ではほぼ無料で運用可能。

---

## 8. 開発環境

### 8-1. ツール構成

| 用途 | ツール | 補足 |
|---|---|---|
| ランタイム管理 | mise | Node/Bunのバージョン管理 |
| パッケージマネージャー・ランタイム | bun | npm/node代替 |
| Linter | oxlint | ESLintの50〜100倍速 |
| Formatter | oxfmt | Prettierの30倍速・互換（Beta） |
| 型チェック | tsgo | TypeScriptの高速実装 |
| テスト | vitest | |
| DBマイグレーション | drizzle-kit | |

### 8-2. リポジトリ構成

monorepo（bun workspaces）

```
wanlog/
  ├── apps/
  │   ├── web/        # React + Vite（フロント）
  │   └── api/        # Hono（Cloudflare Workers）
  ├── packages/
  │   └── types/      # フロント・バック共有型定義
  ├── package.json    # bun workspaces
  └── .mise.toml
```

---

## 9. API設計（Hono RPC）

バージョニングなし。クライアントはHono RPCの型安全なクライアントで呼び出す。

### 認証

| メソッド | パス | 概要 |
|---|---|---|
| POST | /auth/line/callback | LINEコールバック・セッション発行 |
| POST | /auth/logout | ログアウト |
| GET | /auth/me | 自分の情報取得 |

### グループ

| メソッド | パス | 概要 |
|---|---|---|
| POST | /groups | グループ作成 |
| GET | /groups/:groupId | グループ情報取得 |
| PATCH | /groups/:groupId | グループ名変更 |
| GET | /groups/:groupId/members | メンバー一覧 |
| DELETE | /groups/:groupId/members/:userId | メンバー削除 |

### 招待

| メソッド | パス | 概要 |
|---|---|---|
| POST | /groups/:groupId/invitations | 招待リンク発行 |
| GET | /invitations/:token | トークン確認 |
| POST | /invitations/:token/join | グループ参加 |

### 犬

| メソッド | パス | 概要 |
|---|---|---|
| GET | /groups/:groupId/dogs | 犬一覧 |
| POST | /groups/:groupId/dogs | 犬登録 |
| PATCH | /groups/:groupId/dogs/:dogId | 犬プロフィール更新 |

### 投稿

| メソッド | パス | 概要 | 補足 |
|---|---|---|---|
| GET | /groups/:groupId/posts | タイムライン取得 | cursor・limitでページネーション |
| POST | /groups/:groupId/posts | 投稿作成 | mediaはURL配列で受け取る（R2アップロード後） |
| GET | /groups/:groupId/posts/:postId | 投稿詳細 | post_mediaを含めてレスポンス |
| DELETE | /groups/:groupId/posts/:postId | 投稿削除 | |

### リプライ

| メソッド | パス | 概要 |
|---|---|---|
| GET | /posts/:postId/replies | リプライ一覧 |
| POST | /posts/:postId/replies | リプライ投稿 |
| DELETE | /posts/:postId/replies/:replyId | リプライ削除 |

### ストレージ

| メソッド | パス | 概要 |
|---|---|---|
| POST | /uploads/presigned-url | R2アップロード用署名付きURL発行（複数ファイル対応） |

> 画像・動画はクライアントから直接R2にアップロード（presigned URL方式）。Workers経由のバイナリ転送は容量制限があるため。

---

## 10. DBスキーマ詳細

- ORM: Drizzle ORM、マイグレーション管理: drizzle-kit
- DB: Cloudflare D1（SQLite）
- 主キー: UUID v7（時刻順ソート可能）
- 日時: Unixtime の integer で統一（D1はDATETIME型なし）

### users

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| line_id | text | NOT NULL, UNIQUE |
| display_name | text | NOT NULL |
| avatar_url | text | |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `line_id`

### groups

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| name | text | NOT NULL |
| created_at | integer | NOT NULL (Unixtime) |

### group_members

| カラム | 型 | 制約 |
|---|---|---|
| group_id | text | NOT NULL, FK → groups |
| user_id | text | NOT NULL, FK → users |
| role | text | NOT NULL, DEFAULT 'member'（owner / member） |
| joined_at | integer | NOT NULL (Unixtime) |

PRIMARY KEY: `(group_id, user_id)`  
インデックス: `user_id`（ユーザーが所属グループを引くため）

### dogs

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| group_id | text | NOT NULL, FK → groups |
| name | text | NOT NULL |
| breed | text | |
| birthday | text | YYYY-MM-DD形式 |
| icon_url | text | |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `group_id`

### posts

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| group_id | text | NOT NULL, FK → groups |
| user_id | text | NOT NULL, FK → users |
| caption | text | |
| taken_at | integer | Unixtime（任意） |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `(group_id, created_at DESC)`（タイムライン取得）

### post_media

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| post_id | text | NOT NULL, FK → posts |
| media_url | text | NOT NULL |
| media_type | text | NOT NULL（photo / video） |
| order | integer | NOT NULL（表示順） |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `(post_id, order)`

### replies

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| post_id | text | NOT NULL, FK → posts |
| user_id | text | NOT NULL, FK → users |
| body | text | NOT NULL |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `post_id`

### invitations

| カラム | 型 | 制約 |
|---|---|---|
| id | text | PRIMARY KEY (UUID v7) |
| group_id | text | NOT NULL, FK → groups |
| token | text | NOT NULL, UNIQUE |
| expires_at | integer | NOT NULL (Unixtime) |
| used_at | integer | NULL = 未使用 |
| created_at | integer | NOT NULL (Unixtime) |

インデックス: `token`

---

## 11. 認証フロー詳細（LINE OAuth 2.0 + JWT）

### ドメイン構成

| 役割 | ドメイン |
|---|---|
| フロントエンド | wanlog.app（Cloudflare Pages） |
| API | api.wanlog.app（Cloudflare Workers） |

Cookie は `Domain=.wanlog.app` にセットしサブドメイン間で共有。`SameSite=Lax; Secure; HttpOnly`。

### 1. ログイン開始

```
ユーザーが「LINEでログイン」ボタンを押す
  ↓
フロント: LINE認証URLにリダイレクト
  https://access.line.me/oauth2/v2.1/authorize
    ?response_type=code
    &client_id={LINE_CHANNEL_ID}
    &redirect_uri={CALLBACK_URL}
    &scope=profile
    &state={CSRFトークン}  ← sessionStorageに保存
```

### 2. コールバック処理（POST /auth/line/callback）

```
LINEからcodeとstateが返ってくる
  ↓
stateを検証（CSRF対策）
  ↓
LINEのトークンエンドポイントにcodeを送りaccess_token取得
  ↓
LINEのプロフィールエンドポイントでline_id・display_name・avatar_url取得
  ↓
D1でusersをline_idで検索
  ├── 存在する → そのユーザーでログイン
  └── 存在しない → 新規ユーザー作成
  ↓
JWTを発行（payload: user_id、有効期限: 30日）
  ↓
HttpOnly Cookieにセット（Domain=.wanlog.app、SameSite=Lax、Secure）
```

### 3. 認証済みリクエスト

```
リクエストのCookieからJWT取得
  ↓
HonoのJWTミドルウェアで検証
  ↓
c.set('userId', payload.sub) でハンドラに渡す
```

### 4. ログアウト

```
POST /auth/logout
  ↓
CookieのJWTを削除（Max-Age=0）
```

### JWTのpayload

```json
{
  "sub": "user_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

user_idのみ保持。グループ情報などはリクエスト都度D1から引く。

---

## 12. 設計上の主な決定事項

| 決定事項 | 内容 |
|---|---|
| モバイルファースト | スマートフォンからの操作を前提に設計 |
| スタイリング | CSS Modules |
| 複数枚投稿 | post_mediaテーブルを追加。postsからmedia情報を分離 |
| 表示順カラム名 | `order`を使用 |
| 招待リンク発行 | 専用画面を廃止し設定画面に統合 |
| アルバム画面 | MVPでは不要。後付けで追加 |
| いいね機能 | MVPでは不要。後付けで追加 |
| 犬プロフィール | MVPでは不要。dogsテーブルは残しMVP以降に設定画面から任意登録 |
| 初回セットアップ | グループ作成 or 招待参加のみ。犬登録は含まない |
| コメント→リプライ | repliesテーブルで管理。投稿時のコメントはpostsのcaption |
| グループ概念 | 招待・共有の単位はGroupとする |
| postsのgroup_id | dog経由ではなく直接group_idを持つ（検索効率優先） |
| ファイルアップロード | クライアントからR2へ直接（presigned URL方式） |
| セッション管理 | JWT（ステートレス）、有効期限30日 |
| Cookie設定 | HttpOnly、SameSite=Lax、Domain=.wanlog.app |
| 主キー | UUID v7（時刻順ソート可能） |
| 日時型 | Unixtimeのintegerで統一（D1にDATETIME型なし） |
| パスワード認証 | なし。LINEログインのみ |