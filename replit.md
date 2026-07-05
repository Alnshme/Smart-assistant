# Smart Assistant

A three-tool web app: AI coding assistant, CSV/Excel data analyzer, and rewards researcher — powered by the NaraRouter AI API (OpenAI-compatible).

## Run & Operate

- `pnpm --filter @workspace/smart-assistant run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, Wouter routing
- API: Express 5, OpenAI SDK (NaraRouter proxy)
- Data parsing: PapaParse (CSV), xlsx (Excel), react-dropzone
- Charts: Recharts
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/smart-assistant/src/` — React frontend
  - `pages/Chat.tsx` — AI Code Assistant
  - `pages/Analyze.tsx` — Data Analyzer
  - `pages/Rewards.tsx` — Rewards Researcher (pure frontend)
  - `pages/Settings.tsx` — API key configuration
  - `context/AppContext.tsx` — global state (API key, token counter)
- `artifacts/api-server/src/routes/` — Express routes
  - `chat.ts` — POST /api/chat → proxies to NaraRouter
  - `analyze.ts` — POST /api/analyze → proxies to NaraRouter
- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod validation schemas

## Architecture decisions

- NaraRouter API key is stored in `localStorage` client-side and sent in each POST body; never persisted server-side or logged.
- Backend acts as a thin proxy to NaraRouter (OpenAI-compatible at `https://router.bynara.id/v1`), adding only validation via Zod.
- File parsing (CSV/Excel) happens entirely client-side for privacy — raw file bytes never reach the server.
- Token counter is accumulated in `localStorage` across sessions and displayed in the sidebar.
- Backend error logging only captures safe fields (status, code, message) — never the full error object that could expose auth material.

## Product

- **AI Code Assistant** (`/chat`): Multi-turn chat with the Mistral Large model, specialized for coding. Supports markdown + code blocks. Arabic system prompt.
- **Data Analyzer** (`/analyze`): Upload CSV or Excel files; see row previews, stats, a scatter chart, and AI insights.
- **Rewards Researcher** (`/rewards`): Keyword search returns categorized links and tips. Fully client-side.
- **Settings** (`/settings`): Enter/clear NaraRouter API key, reset token counter.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The NaraRouter model is `mistral-large`. Change in `routes/chat.ts` and `routes/analyze.ts` if needed.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Backend logs only safe error fields — never add raw `err` object logging in route handlers.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
