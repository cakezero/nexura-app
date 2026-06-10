# Nexura → Next.js Port Blueprint (authoritative) — FRONTEND-ONLY REWRITE

**SCOPE (owner, locked): this is a FRONTEND rewrite ONLY. Do NOT touch or port the backend.** The existing Express/Bun server in `...\nexura-app\server` stays exactly as-is and keeps running as the backend. The Next app we build is PURELY the frontend (pages + components + client-side data fetching) and talks to the EXISTING backend over HTTP. NO API route handlers, NO Mongoose models, NO db/redis, NO server utils, NO auth guards, NO controller adapter, NO Discord-bot relocation in the Next app. None of `app/api/**`, `src/server/**`, `src/lib/server/**`.

Source frontend: `C:\Users\orion\Desktop\nawa\nexura-app\client` (React18 + Vite7 + TS, **wouter** router, shadcn/Radix, wagmi/RainbowKit/Reown, TanStack Query, Intuition SDK). 226 src files.
Target: `C:\Users\orion\Desktop\nawa\nexura-next` — **Next 14 + React 18 + Tailwind v3**, App Router, TS, `src/`, alias `@/*`→`./src/*`.
**Always read the actual source files for per-file detail; this is the plan.**

## KEY DECISIONS
- **DESIGN PARITY (hard rule): the port is VERBATIM. Copy every page/component's JSX + className strings + inline styles EXACTLY. Copy index.css + tailwind tokens + all 60 shadcn components as-is. The ONLY changes allowed are routing idioms (wouter→Next) and env idioms (VITE_→NEXT_PUBLIC_). NO restyling, NO layout changes, NO "improvements". It must look pixel-for-pixel identical to the current Vite app.**
- **RUN BOTH ON LOCALHOST + verify all data (owner requirement):** run the EXISTING backend locally on :5600 (Mongo `nexura-dev`) AND the Next frontend, and confirm the frontend actually reaches the backend and fetches EVERY available dataset on every page (not just a clean build). Run the Next dev server on **:5173** (the origin the backend's ALLOWED_ORIGINS already permits) so CORS works WITHOUT touching the backend → `next dev -p 5173`; set NEXT_PUBLIC_BACKEND_URL=`http://localhost:5600` for local dev.
- FRONTEND-ONLY: client (React+Vite) → Next.js. Backend untouched; Next frontend calls it at **NEXT_PUBLIC_BACKEND_URL = the existing backend URL** (local dev: `http://localhost:5600`; prod value lives in source `client/.env` VITE_BACKEND_URL / `https://api-nexura.intuition.box`). The 4 API client modules keep building `${BACKEND_URL}/api/...` — just rename the env var. NOT same-origin.
- Router = **wouter** (NOT react-router; react-router-dom is in deps but unused). Idioms: `useLocation()[0]`→`usePathname()` (next/navigation); `useLocation()[1]`(setLocation)→`useRouter().push`; wouter `useParams`→next/navigation `useParams`; wouter `<Link href>`→`next/link` (href prop matches); delete `<Switch>/<Route>`.
- **Every page is a client component** (`"use client"`) — they use hooks/wagmi/localStorage. shadcn `components/ui/*` (60) copy verbatim. Docs content components are the only RSC candidates (defer; keep client for parity first).
- Auth = client-side JWT in **localStorage** (4 token keys) — unchanged; the existing backend reads `Authorization: Bearer`. Never read tokens in server components/layouts (SSR-incompatible).
- Drop frontend build cruft: vite, @vitejs/*, @replit/*, react-router-dom. DO NOT add any server/runtime deps (no mongoose, jsonwebtoken, bcrypt, aws-sdk, nodemailer, ioredis, cloudinary, http-status, graphql-request, etc.) — the frontend doesn't run the backend. ethers/viem stay (client wallet use).

## ROUTE GROUPS (client → app/)
- `(main)/` — public app: `/`(home, no chrome) `/discover /levels /learn /learn/[id] /quests /campaigns /ecosystem-dapps /referrals /quest/[questId] /campaign/[campaignId] /campaigns/tasks /quests/tasks-card /discord/callback /x/callback /analytics /portal-claims /portal-claims/[id] /profile /profile/edit /achievements /leaderboard /ref/[referrerCode]`. Layout picks bg/sidebar/header by path (port App.tsx chrome logic into `(main)/layout.tsx`).
- `(docs)/docs/[[...slug]]` — optional catch-all, own layout (AnalyticsBackground), slug→content map.
- `(studio)/` — studio + dashboards: `/studio /studio/select-role /studio/projects-hub /studio/users-hub /studio/users/{create,user-signup,user-signin} /studio/projects/create /studio/register /studio/reset-password /projects/create/{create-hub,signin-to-hub,the-hub}`; **guarded dashboards** under nested layouts: `/user-dashboard*` (layout=UserLayout) and `/studio-dashboard*` (layout=StudioLayout, but StudioDashboard self-renders chrome). Per-route title: derive from `usePathname()` inside the layout (layouts already derive active tab from path).
- root `not-found.tsx` for `*`.
Pages live in `client/src/pages/**` (60 files incl studio/project[17], studio/user[9]). Drop dead: `Analyticss.tsx`, `components/examples/*`, unrouted `Rewards/Signal/Community/Tiers/CampaignCreate` (verify first, don't auto-delete).

## DATA LAYER (4 API modules in client/src/lib — copy as-is, just rename the env var)
- `queryClient.ts` (apiRequest/apiRequestV2/getQueryFn/queryClient) token `nexura:token` (+ `x-wallet-address` from `nexura:wallet`) — main app + TanStack Query.
- `config.ts` (apiRequest) token `nexura-admin:token` — admin.
- `projectApi.ts` token `nexura-project:token`/`nexura:proj-token` — studio hub.
- `userApi.ts` token `nexura_user_session.token` — user hub.
All use `fetch` + `Authorization: Bearer`; harvest refreshed token from response headers. `services/graphql.ts` hits `mainnet.intuition.sh/v1/graphql` directly (client). Env reads `import.meta.env.VITE_*` in 4 files (constants.ts, wagmiConfig.ts, remoteDb.ts, studio/user/QuestCreate.tsx) → `process.env.NEXT_PUBLIC_*`. **BACKEND_URL stays the existing backend** (do NOT set "").

## PROVIDERS (src/app/providers.tsx, "use client", mounted in root layout)
WagmiProvider(wagmiConfig) → QueryClientProvider(queryClient) → RainbowKitProvider(darkTheme, import rainbowkit/styles.css) → AuthProvider(lib/auth.tsx) → TooltipProvider → SidebarProvider(defaultOpen=false) → children + <Toaster/>. Run `configureClient({apiUrl})` from @0xintuition/graphql at module scope (before children). wagmiConfig = RainbowKit getDefaultConfig({appName:"Nexura", projectId:NEXT_PUBLIC_REOWN_PROJECT_ID, chains:[chain]}); chain from lib/chain.ts by NEXT_PUBLIC_NETWORK (mainnet 1155 / testnet 13579). SSR: add `ssr:true` OR gate first paint behind a `mounted` flag to avoid hydration mismatch.

## CONFIG/BUILD
- Tailwind v3 + PostCSS: port `client/tailwind.config.ts` (content→`./src/**/*.{ts,tsx}`, keep tailwindcss-animate + @tailwindcss/typography, darkMode class, the hsl(var(--x)/<alpha-value>) tokens). `postcss.config.js` = {tailwindcss,autoprefixer}. `client/src/index.css` (3830 lines, fonts + CSS vars) → src/app/globals.css, imported once in root layout. Migrate index.html head (title/favicon/fonts/`<div id="modal-root">`/`body class="dark"`) → root layout metadata + body. Copy `client/public/` (351 files) → `nexura-next/public/`. SVG module imports in ProofOfActionModal (src/assets/proof-modal/*) → next static import (`imported.src` or next/image). components.json (new-york, rsc:false, cssVariables, baseColor neutral) → same config.
- tsconfig: keep `@/*`→`./src/*`; remove allowImportingTsExtensions; strip `.ts` extensions from relative imports if any.
- Env (frontend, all NEXT_PUBLIC_): NETWORK (testnet|mainnet), ENV, **BACKEND_URL (existing backend URL)**, CLIENT_URL, REOWN_PROJECT_ID (required for RainbowKit), DISCORD_CLIENT_ID, X_CLIENT_ID, PROXY_FEE_CONTRACT. (remoteDb.ts has 2 import.meta.env reads — inspect.)

## PORT ORDER (incremental, build-verify each)
1. Foundation: deps (frontend only) + tailwind/postcss/components.json/globals/root layout/public copy.
2. Shared libs/utils + types/schemas/hooks + shadcn/ui (60).
3. Providers + web3 (wagmiConfig/viem/queryClient/session/auth + the 4 API modules→existing backend + use-wallet) → providers.tsx + root layout.
4. Pages by section: (main) public → (docs) → (studio) project → (studio) user → dashboards (layouts). Port shared page components (Header, sidebars, backgrounds, cards, modals) alongside.
5. Wire + RUN BOTH on localhost + fix: `bunx next build` clean; start the existing backend on :5600 (Mongo nexura-dev) and `next dev -p 5173`; click through EVERY route and confirm every API dataset loads (quests, campaigns, leaderboard, lessons, profile, claims, hubs, analytics, referrals, etc.); fix wouter/hydration/env/CORS until the app works end-to-end against the live local backend with full design parity.

## LOCAL RUN FACTS (verified from source .env — for the integration pass)
- Backend start: `cd C:\Users\orion\Desktop\nawa\nexura-app\server && bun --watch server.ts` (default port **:5600**; :5600 was already OPEN → a backend may already be running). devDeps have tsx/ts-node but `dev` script = bun watch.
- Backend data: connects to a **remote** MongoDB Atlas cluster, db **nexura-dev**, and a **remote** Redis Cloud instance — NOT localhost. So local mongod/redis don't matter; the backend just needs internet + its existing `server/.env` (do NOT modify it). It serves real **testnet** data.
- `ALLOWED_ORIGINS` already permits `http://localhost:5173` + `http://localhost:5174` (+ prod). → run Next dev as `next dev -p 5173` for CORS-free calls; if :5173 is occupied by the old Vite client, stop that first (the Vite client is being replaced). NEXT_PUBLIC_BACKEND_URL=`http://localhost:5600`.
- Source `NETWORK=testnet`, `ENVIRONMENT=development`, `CLIENT_URL=http://localhost:5173`, `ADMIN_URL=http://localhost:5174`. Both `client/.env` and `server/.env` exist (real values incl. REOWN project id live in `client/.env` — the foundation agent copies them).

## GOTCHAS (frontend)
wagmi SSR (ssr:true or mounted-gate; rainbowkit css client-side; guard `typeof window`). localStorage/window/document in 56 files/207 hits → read in effects/handlers not render, or mounted-gate. wouter→App-Router across 64 files/~250 sites. TanStack Query stays client-only (staleTime Infinity). `.ts` import extensions → strip. Per-route layout titles → derive from usePathname() in layout. Don't auto-delete dead code; flag it. CORS: the existing backend already allowlists the client origin — when running the Next dev server on a new port/origin, the backend's ALLOWED_ORIGINS may need the Next origin added (a backend .env change the owner makes, NOT a Next code change).
