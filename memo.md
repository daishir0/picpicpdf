# picpicpdf システム運用メモ

## 概要

アウトバウンド電話アンケート・商材訴求システム。Twilio（050番号）で自動発信し、TTS/音声認識でアンケートを実施、結果をDBに保存する。

## ポート番号

| サービス | ポート | 用途 |
|---------|--------|------|
| Frontend (Next.js) | 3029 | 本番 (systemd) |

**注意**: 上記以外のポート（3000, 3001, 8000等）は使用禁止

## systemdサービス

### サービス名
- `picpicpdf.service` - Next.js アプリケーション（API Routes + Twilio Webhook含む）
- サービスファイル: `/etc/systemd/system/picpicpdf.service`
- ソース: `infrastructure/systemd/picpicpdf.service`

### 起動・停止・再起動コマンド

```bash
sudo systemctl start picpicpdf    # 起動
sudo systemctl stop picpicpdf     # 停止
sudo systemctl restart picpicpdf  # 再起動
systemctl status picpicpdf        # 状態確認
```

### ログ確認

```bash
journalctl -u picpicpdf -f            # リアルタイムログ
journalctl -u picpicpdf -n 100        # 最新100行
journalctl -u picpicpdf --since today # 今日のログ
```

## 公開サービスURL・リバースプロキシ

- URL: `https://picpicpdf.path-finder.jp`
- Apache設定: `/etc/httpd/conf.d/picpicpdf.path-finder.jp.conf`
- ソース: `infrastructure/apache/picpicpdf.path-finder.jp.conf`
- SSL: Let's Encrypt ワイルドカード証明書 (`*.path-finder.jp`)

## データベース

- PostgreSQL: `picpicpdf` DB / `picpicpdf` ユーザー
- 接続: `postgresql://picpicpdf:picpicpdf@localhost:5432/picpicpdf`

### 主要テーブル
- Campaign: キャンペーン（スクリプト・スケジュール含む）
- SurveyQuestion: アンケート質問（VOICE/DTMF/BOTH対応）
- PhoneNumber: 電話番号リスト（ステータス管理）
- CallRecord: 通話記録（Twilio CallSid紐付け）
- SurveyResponse: アンケート回答（音声/DTMF）

## Twilio連携

### Webhookエンドポイント
- `POST /api/twilio/voice` - 通話開始時のTwiML
- `POST /api/twilio/gather` - 回答受信・次の質問
- `POST /api/twilio/status` - 通話状態コールバック
- `POST /api/twilio/fallback` - エラー時フォールバック

### 必要な設定（管理画面 → 設定）
- Twilio Account SID
- Twilio Auth Token
- Twilio 050電話番号（E.164形式: +815012345678）
- TTS音声（Polly.Mizuki等）

## テスト方針

### 総合テスト（E2Eテスト）

**重要**: 総合テストは必ずインターネット側からE2Eテストを実施すること。

```bash
npx playwright test
```

- テスト対象URL: `https://picpicpdf.path-finder.jp`
- ローカルホスト（localhost, 127.0.0.1）でのテストは原則禁止
- 本番環境と同じ条件でテストを実施する

## ディレクトリ構成

```
58_pj-PicPicPDF/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # トップページ
│   │   ├── admin/        # 管理画面
│   │   │   ├── campaigns/  # キャンペーン管理
│   │   │   ├── settings/   # Twilio設定等
│   │   │   └── users/      # ユーザー管理
│   │   └── api/
│   │       ├── admin/      # 管理API
│   │       └── twilio/     # Twilio Webhook
│   └── lib/
│       ├── twilio.ts       # Twilioクライアント
│       ├── twiml.ts        # TwiML生成
│       ├── call-engine.ts  # コールエンジン
│       ├── prisma.ts       # DB接続
│       ├── session.ts      # セッション
│       ├── auth.ts         # 認証
│       └── settings.ts     # 設定取得
├── prisma/               # Prisma ORM
├── infrastructure/
│   ├── systemd/          # サービス定義
│   └── apache/           # リバースプロキシ
└── tests/e2e/            # E2Eテスト
```

## コード変更の反映

```bash
npm run build && sudo systemctl restart picpicpdf
```

## GitHubレポジトリ

- URL: `https://github.com/daishir0/picpicpdf`

## UI/UX

要件はもちろん抜け漏れなく、UI/UXは素晴らしいベストプラクティスなレスポンシブデザインとすること
