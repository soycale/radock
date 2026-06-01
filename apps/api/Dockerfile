FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ── deps: install production dependencies ─────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
# --prod skips devDeps (vitest, typescript, @types/*); tsx is in deps so included
RUN pnpm install --frozen-lockfile --prod

# ── runner: deps + source only ─────────────────────────────────────────────────
FROM deps AS runner
# Copy type package source (workspace: dep, resolved at runtime by Node)
COPY packages/types ./packages/types
# Copy API source (tsx runs TypeScript directly — no tsc compile step)
COPY apps/api/src ./apps/api/src

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "--import", "tsx/esm", "apps/api/src/index.ts"]
