# ガントチャートツール（プロジェクト管理）

React + Vite で作った、シンプルなプロジェクト管理（ガントチャート）ツールです。

## 公開URL（GitHub Pages）

- `（ https://dhiabora.github.io/gantt-chart-tool/）`

## 主な機能

- **プロジェクト追加/切り替え**
- **タスク追加**
- **タスク編集**（左側のタスクカードをクリック）
- **タスク内容（150文字まで）**の登録・全文表示
- **開始日のドラッグ移動**（タイムライン上のタスクバーを左右にドラッグ）
- **進捗更新**（スライダー）
- **土日列の背景を薄いグレーで表示**
- **保存ボタン**（Supabase 利用時はクラウドへ即保存、未設定時は LocalStorage へ明示保存）
- **LocalStorage保存**（Supabase 未使用時は自動保存。使用時はバックアップ用キーも利用）

## 使い方

- **今の内容を確実に残す**: 右上の「保存」（クラウド or ブラウザ）
- **タスクを追加**: 右上の「タスク追加」
- **タスクを編集**: 左のタスク一覧のカードをクリック → 「更新する」
- **開始日を動かす**: タスクバーを左右にドラッグ（開始日/終了日を同じ日数だけスライド）
- **プロジェクトを追加**: 「プロジェクト追加」
- **プロジェクト切り替え**: 画面上部のプロジェクト選択ドロップダウン

## 開発（ローカル）

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

生成物は `dist/` に出力されます。

## 変更を GitHub に push する（ターミナル）

```bash
cd /Users/fumiakiwake/Documents/GitHub/gantt_chart_tool

git status
git add .
# .env を誤って含めないこと。外す場合: git reset HEAD .env

git commit -m "変更内容の説明"
git push origin main
```

初回のみリモート未設定なら:

```bash
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git branch -M main
git push -u origin main
```

## デプロイ（GitHub Pages）

- `.github/workflows/deploy.yml` で GitHub Actions から `npm ci` → `npm run build` → `dist/` を Pages にデプロイします。
- `Settings` → `Pages` → `Source` は **GitHub Actions** を選択してください。

## データ保存について（LocalStorage）

このツールはサーバーを持たず、ブラウザの `LocalStorage` にデータを保存します。
別PC/別ブラウザ/シークレットモードではデータが共有されません。

## Supabase連携（複数人共有用）

環境変数を設定すると、`projects` と `tasks` を Supabase に同期します。
未設定の場合はこれまで通り LocalStorage のみで動作します。

1. `.env.example` をコピーして `.env` を作成
2. `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定
3. Supabase で以下のテーブルを作成

```sql
create table if not exists projects (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  assignee text,
  description text,
  start_date date not null,
  end_date date not null,
  progress int not null default 0,
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);
```

認証ユーザーごとに分ける場合は、両テーブルに `user_id uuid references auth.users(id)` を追加し、RLS で `user_id = auth.uid()` を使ってください。**`user_id` が無い・RLS で書き込み拒否**だと画面上部に「保存: …」エラーが出たり、リロード後にデータが戻らないことがあります。

Supabase 利用時は、同一ブラウザ向けに `gantt_state_v1_u_<ユーザーID>` キーでもバックアップします（早いリロードや一時的な同期遅延の救済用）。

## 結論（共有の考え方）
共有しなければ他人には見えない → はい
共有したいならログイン情報を渡す → 動くけど推奨しない
推奨は、次段階で「ユーザー招待型の共有機能」を実装することです
必要なら次、最小構成の共有機能（閲覧のみ→編集可）を設計して実装します。

## セキュリティ注意

- **機密情報を入れない**: LocalStorage はブラウザ内に平文で保存されます（同一PCの別ユーザー/マルウェア/拡張機能等の影響を受ける可能性があります）。
- **XSSに注意**: 現状はユーザー入力をHTMLとして描画していませんが、将来 `dangerouslySetInnerHTML` 等を使う場合は特に注意してください。
- **共有端末に注意**: 共有PCだとデータが残ります。必要なら「データ削除」機能の追加を推奨します。
