# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# package.json / lock ファイルのみコピー（キャッシュ効率UP）
COPY package*.json ./

COPY prisma ./prisma/

# devDependencies も必要 → build に必要
RUN npm install

# プロジェクト全体コピー
COPY . .

# Prisma Client を生成
# ビルド用にダミーの環境変数をセットして実行
# RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Next.js をビルド
RUN npm run build

# -----------------------------
# Stage 2: Production Runner
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# builder から必要なものだけコピー
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]
