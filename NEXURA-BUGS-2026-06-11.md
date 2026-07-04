# Nexura bug diagnosis — 2026-06-11

Repo: `C:\Users\orion\Desktop\nawa\nexura-app` (branch `main`, up-to-date with origin cakezero/nexura-app).
Method: read committed code + ran the local backend (`bun --watch server.ts`, port :5600) against the live **nexura-dev** Atlas + Redis (via `server/.env`) and reproduced where feasible. Diagnosis only — nothing modified/committed/pushed. The ~8 uncommitted local files are QA harness scripts (`server/qa-*.mjs`) + `.review-screens/`; **none of them is a culprit** (all bugs are in committed code/config).

---

## TL;DR

- **Bugs 1 and 2 are the SAME feature** — the **Proof-of-Action modal** (`client/src/components/ProofOfActionModal.tsx`). Bug 2 is the balance line; bug 1 is the claim flow that modal drives.
- **Bug 1 root cause is committed and confirmed by live test:** the XP-claim path that POA "Create claim" stakes against (`/api/user/claim-deposit-xp`) writes an `xpLog` with `type: "deposit-xp"`, which is **not in the xpLog mongoose enum** → ValidationError → claim fails. There is also a second, broader chokepoint shared by every POA claim type (`/api/user/update-claims-created` → `getAmountPaid`) — see Bug 1.
- **Bug 3 is NOT a server bug and NOT an SMTP bug.** Against nexura-dev I reproduced both forgot-password flows returning **200**, saving a valid OTP (with `page`), and Gmail SMTP **authenticating + sending successfully**. The `page`-field regression and the SMTP creds are both fine on dev. The committed `resetPasswordOTPEmail` *does* swallow send errors (so a prod-only SMTP failure would be invisible), and the most likely real-world cause is **deployment/config**, not code logic. Details + the exact swallow site below.
- These three are **not one shared bad commit.** Bug 1's bad enum value dates to `32e6455` (2026-05-14), not a recent regression.

---

## BUG 1 — XP claims failing

**ROOT CAUSE (confirmed):** `claimDepositXp` writes `xpLog.create({ ..., type: "deposit-xp" })`, but `"deposit-xp"` is **not** a member of the `xpLog.type` enum, so Mongoose throws a ValidationError and the claim never completes. Verified live: validating that exact doc returns `` `deposit-xp` is not a valid enum value for path `type` `` while `lesson`, `quest`, `daily-xp`, etc. all validate. This is the only one of the 13 `xpLog.create` call sites in the server whose `type` is invalid.

**Exact file:line**
- Bug site: `server/src/controllers/app.controller.ts:340-346` (the `xpLog.create({... type: "deposit-xp"})` inside `claimDepositXp`).
- Schema it violates: `server/src/models/xpLog.model.ts:8` (enum list has no `"deposit-xp"`).
- The swallowing catch: `server/src/controllers/app.controller.ts:351-353` — note it returns **HTTP 200** with `{ error: "error adding claim xp" }`, and because the throw happens at line 340 (`xpLog.create`) **before** `trustUser.save()` at line 348, the user's `xp` is **not** persisted. (200-with-error means the client can't even tell it failed.)
- Route: `server/src/routes/user.routes.ts:27` (`.post("/claim-deposit-xp", claimDepositXp)`).

**PROPOSED FIX (server, 1 line):** add `"deposit-xp"` to the enum at `server/src/models/xpLog.model.ts:8`:
```ts
type: { type: String, enum: ["single","batch","quest-creation","wotw","contest","spotlight","daily-xp-streak-reward","campaign","referral","ecosystem-quest","quest","daily-xp","deposit-xp","lesson"], required: true },
```
(Also worth fixing the catch at app.controller.ts:353 to return a non-2xx so failures aren't masked.)

**Second, broader chokepoint (the real "EVERY claim fails" candidate — needs runtime confirmation):**
All four POA claim handlers in the client `await` `/api/user/update-claims-created` **first**, before the type-specific reward call:
- `client/src/app/(main)/learn/[id]/page.tsx:525` then `:527` (`/api/lesson/reward-lesson-xp`)
- `client/src/app/(main)/quest/[questId]/page.tsx:157` then `:159` (`/api/quest/claim-quest`)
- `client/src/app/(main)/campaign/[campaignId]/page.tsx:396` then `:398` (`/api/campaign/complete-campaign`)
- `client/src/app/(main)/ecosystem-dapps/page.tsx:131` then `:133` (`/api/quest/claim-ecosystem-quest`)

`updateClaimsCreated` (`server/src/controllers/app.controller.ts:1171`) calls `getAmountPaid(txHash)` at `:1193` and rejects unless `from.toLowerCase() === userToUpdate.address` at `:1194`. `getAmountPaid` (`server/src/utils/utils.ts:410-423`) does `provider.getTransaction(txHash)` and **throws `"Transaction not found"`** if the tx isn't on the server's configured chain. Because the client `await`s this before the reward call, **any failure here fails every POA claim type uniformly** — which precisely matches "ALL XP claims are failing."
- I verified the server RPC (`https://testnet.rpc.intuition.systems`, chainId 13579) is **up** and returns `null` for an unknown hash (→ "Transaction not found" → 500). So the infra is healthy; this path only breaks per-claim if the POA stake `txHash` is missing/unconfirmed/on a different chain at claim time (e.g. client and server chain/RPC drift, or claiming before the stake tx is mined). I could not drive a real on-chain POA stake without a funded testnet wallet + the deployed frontend, so I could not 100% reproduce this specific failure end-to-end.

**Reproduced?**
- `deposit-xp` enum break: **YES** (schema-validation proof against the live model; deterministic).
- "every POA claim fails via update-claims-created": **NO (could not run a real stake tx)** — but it is the only code path shared by all four claim types and is a strong structural match for the report.
- Counter-evidence: hitting the reward endpoints directly (without the POA stake/`update-claims-created` precondition) **succeeds** on nexura-dev (lesson `reward-xp` → 200 `{reward:500}`, quest `claim-quest` → 200, daily sign-in → 200). So the reward controllers themselves are fine; the failure is upstream in the POA stake/`update-claims-created` gate and/or the deposit-xp enum.

**Is it a recent regression?** The `deposit-xp` literal has been present since commit **`32e6455` (2026-05-14)** — **not** the last few hours. No `server/src` XP-claim controller code changed in the last ~2 days (the only recent `server/src` edit is the OTP `page` field in `hub.auth.controller.ts`). So if the owner's "regressed tonight" is literal, the trigger is most likely **runtime/config** (RPC/chain drift, or the deployed POA stake tx not landing on the server's chain) hitting the `update-claims-created`→`getAmountPaid` gate — not a new commit. If "all claims" was shorthand for "the POA/TRUST-deposit claim I clicked," the `deposit-xp` enum is the direct answer.

**Confidence:**
- deposit-xp enum is a real claim-breaking bug: **HIGH**.
- It (or the shared update-claims-created/getAmountPaid gate) is the owner's "all claims failing": **MEDIUM** (enum proven; the universal-failure path is structurally identified but not runtime-reproduced).

---

## BUG 2 — POA modal shows inaccurate connected-wallet $TRUST balance

**ROOT CAUSE (confirmed by code read):** the balance is formatted by casting an 18-decimal **wei `bigint` to a JS `number` *before* scaling**: `(Number(walletBalance) / 10 ** 18).toFixed(2)`. `Number(bigint)` loses precision above 2^53 (~0.009 TRUST in wei), so the displayed figure's trailing digits are IEEE-754 rounding garbage for any non-trivial balance. The **source and decimals are correct** — TRUST is the chain's native currency (18 decimals), and the code reads the native balance — so this is purely a formatting/precision bug, not wrong-token/wrong-decimals/stale-state.

**Exact file:line** (`client/src/components/ProofOfActionModal.tsx`)
- Fetch (correct): `:96` — `const balance = await publicClient.getBalance({ address })` (native balance; refetches on account change via the `useEffect` deps `[open, address, txHash]` at `:105`).
- State (bigint): `:77` — `const [walletBalance, setWalletBalance] = useState<bigint>(0n)`.
- **The bug:** `:333` — `{(Number(walletBalance) / 10 ** 18).toFixed(2)} TRUST`.
- Native-currency confirmation: `client/src/lib/chain.ts:4-38` (TRUST/tTRUST defined as `nativeCurrency`, decimals 18) and the stake path `client/src/services/web3.ts:107` (`parseEther(...)` sent as native `value`).

**PROPOSED FIX (client):** scale the bigint losslessly first with viem's `formatUnits`/`formatEther`, then cast for display:
```tsx
import { formatUnits } from "viem";
// ...
{Number(formatUnits(walletBalance, 18)).toFixed(2)} TRUST
```
(`formatEther(walletBalance)` is equivalent here since decimals = 18.)

**Reproduced?** No — static analysis. Rendering the modal requires a connected, funded Intuition wallet (RainbowKit/WalletConnect). The defect is a textbook `Number(bigint)`-before-scale precision bug, fully determinable from the typed flow (`bigint` at :77 → native wei at :96 → `Number()` at :333). The inaccuracy is invisible for tiny balances and grows with balance size.

**Confidence:** HIGH (fetch/format split, native-token + 18-decimals, and the offending line all verified).

---

## BUG 3 — OTP sending "broken" for project AND user admin dashboards

**ROOT CAUSE:** Against nexura-dev I could **not** reproduce a broken OTP send — the committed server flow works end-to-end. The "known prior `page`-field regression" is **fixed in committed code**, and **Gmail SMTP authenticates and sends fine** with the current `server/.env` creds. The genuinely suspect committed item is that the forgot-password mailer **swallows send errors** (so a prod-only SMTP failure would silently look like "no email, but success toast"). The most probable real-world cause is therefore **deployment/config on the box the owner is testing** (prod backend `api.nexura.intuition.box`, possibly different/rate-limited Gmail app password, port 587 egress blocked, etc.), not the dev code logic.

**What I verified live (nexura-dev backend on :5600):**
- Project hub: `POST /hub/forgot-password {email:"admin@admin.com", role:"project"}` → **200** `{"message":"password reset code sent!"}`, new OTP saved with `page:"project"`, server log `[TEST] OTP for admin@admin.com: 277511`.
- User hub: `POST /user-hub/forgot-password {email:"andrew.orion9@gmail.com"}` → **200** `{"message":"password reset code sent!"}`, OTP saved with `page:"user"`, server log printed the code.
- Direct `transporter.verify()` for BOTH transports (`smtp.gmail.com:587` and `service:"gmail"`) → **OK** (Gmail accepts EMAIL_USER/EMAIL_PASSWORD).

**Relevant file:line**
- `page` field present (no ValidationError) in all OTP writers:
  - `server/src/controllers/hub.auth.controller.ts:376` (`forgotPassword`, `page:"project"`)
  - `server/src/controllers/hub.auth.controller.ts:701` (`userHubForgotPassword`, `page:"user"`)
  - `server/src/controllers/hub.auth.controller.ts:803` (`validateHubEmail`, `page: page || "project"`)
- OTP model requiring `page`: `server/src/models/otp.model.ts` (`page` enum `["user","project"]`, `required:true`).
- **Error-swallow (the real committed liability):** `server/src/utils/sendMail.ts:97-113`, `resetPasswordOTPEmail` — the `// throw new Error(error.message); // Don't throw for now so I can test the flow` means forgot-password returns 200 **even if the email send throws**. By contrast `sendOTPConfirmEmail` (signup verification, `:165-179`) and `sendEmailToAdmin` (top-level admin invite, `:62-79`) **do** re-throw, so a broken SMTP would surface there as a 500 instead.
- SMTP transport config: `server/src/utils/sendMail.ts:20-50` (falls back to `smtp.gmail.com:587 requireTLS` because `SMTP_HOST/PORT/SECURE` are **not** set in `server/.env`).
- Client request shape (correct, rules out payload mismatch): project trigger `client/src/app/(studio)/projects/create/signin-to-hub/page.tsx:67-71` posts `/hub/forgot-password {email, role:"project"}`; reset page `client/src/app/(studio)/studio/reset-password/page.tsx:72-73,104-105` posts `{email, code, password}` to `/user-hub/reset-password` and `/hub/reset-password` — exact server match.
- Config caveat worth checking on the deployed client: backend URL is hardcoded to **production** in `client/next.config.mjs:6` (`NEXT_PUBLIC_BACKEND_URL: "https://api.nexura.intuition.box"`) while `client/.env.production` says `staging-api...`. So the deployed Next.js client talks to the **prod** backend — that prod box's Gmail creds / SMTP egress, not this repo's dev `.env`, govern whether OTP emails actually go out.

**PROPOSED FIX:**
1. Make the failure visible: un-comment the re-throw in `resetPasswordOTPEmail` (`server/src/utils/sendMail.ts:111`) so a real SMTP failure returns 500 instead of a false "code sent!" 200. (Right now a broken prod mailer is undiagnosable from the client — this is the single highest-value change for this bug.)
2. On the deployed/prod backend that the owner is actually testing: verify `EMAIL_USER`/`EMAIL_PASSWORD` is a **valid current Gmail app password** (16-char), that 587 egress isn't blocked, and consider setting `SMTP_HOST/SMTP_PORT/SMTP_SECURE` explicitly. (The dev creds work — confirm prod's do too; a 535 there would currently be swallowed.)

**Reproduced?** Attempted and **could not reproduce a failure on nexura-dev** — both flows succeeded (200 + OTP saved + SMTP verified). So the breakage is environment-specific (prod creds/SMTP/deploy) and/or masked by the swallowed throw, not a logic bug in the committed controllers.

**Confidence:**
- Committed forgot-password logic + `page` field + dev SMTP all work: **HIGH** (live-verified).
- Exact prod failure cause: **LOW–MEDIUM** — can't see prod env from here; the swallowed-throw + prod-creds path is the most likely explanation and the swallow is a confirmed committed liability.

---

## Shared-root-cause verdict

- **Bugs 1 + 2 = same component** (`ProofOfActionModal.tsx`): bug 2 = balance display (line 333), bug 1 = the claim it stakes (`deposit-xp` enum at app.controller.ts:345, plus the shared `update-claims-created`/`getAmountPaid` gate).
- **Bug 3 is separate** and is **not** a single bad commit with the others. The OTP `page` regression is already fixed in committed code; dev SMTP works; the real cause is deployment/config + the swallowed send error.
- No single commit explains all three. Bug 1's bad enum literal predates the others (`32e6455`, 2026-05-14).
