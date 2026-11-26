# Azericard / Rabita Bank Payment & Wallet Integration Plan

Written 2026-10-16, in response to Rabita Bank's email requesting a **Callback URL** and an
**RSA 2048 public key** to begin Azericard e-commerce integration testing.

---

## 0. Answer the bank's two questions now

These are the two concrete things needed to reply to Rabita Bank today.

### Callback URL

```
https://api.satgo.az/api/payments/azericard/callback
```

This domain is already live with a valid SSL certificate (see `DEPLOYMENT.md`), so it's usable
immediately — the endpoint itself doesn't exist in code yet (§5 below), but the URL can be given
to the bank now; it just needs to exist before the bank actually starts sending test callbacks.

### RSA 2048 public key

Generated fresh for this integration (`backend/keys/azericard/`, gitignored — see §7 on why this
had to be a new pair, not a reused one). Public key to send to the bank:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi1hmaOah6wNIlLdjjLZ1
rxop0+KnwrVOw2PUQQE7XEPH/Gp/PK3YdaGQwqhLT+eX+aJHs55D4ZGRP5VjsCGu
mj0NUv4dkaryDcmQxyTGdy3nNKkwSILG91VKljVACICLTWSWVX1h/Pj9Z+yUS9Gn
eNal7Dd0tkvLMHt7VRqcGs5nzAPQ2uot9f7yVR6R6B7HOMc4aGUu12HOQv3Y5FN0
L06SLoinWv9mEgxR4VaiQ5DN+rYCfWHIS5McCTcye5aTEWQotKaWKMHucb9qWwmA
ehbM784MSJvaFjw9P8H4CQfVV9PJO/9L2zipHz72VA8guVWTG9cgeYLtqk7nwWGp
swIDAQAB
-----END PUBLIC KEY-----
```

The private half stays on this machine (and later, only on the production server's filesystem,
never in git — see §7) and is what our backend will use to *sign* outgoing requests; this public
key is what Azericard uses to verify those signatures.

---

## 1. Current state of the codebase (why this isn't starting from zero)

A previous attempt at this exact integration (`payment-microservice/`) was built, then removed
from the project entirely in September (`chore: remove payment-microservice`, #193) because it
was never finished — it crash-looped in production on a missing private key and the whole
service was retired rather than fixed. Its code is still recoverable from git history
(`git show ed2ef65:payment-microservice/...`) and is a genuinely useful starting point:

- `crypto.service.js` — RSA-SHA256 signing (`generateMAC`) and verification (`verifyMAC`),
  exactly matching what Azericard's `P_SIGN` scheme needs.
- `azericard.service.js` — builds the signed request for authorization (`TRTYPE=1`),
  preauthorization (`TRTYPE=0`/`21`), refund (`TRTYPE=24`), status inquiry (`TRTYPE=90`), and a
  `verifyCallback()` that checks `P_SIGN` on incoming webhook data.
- `generate-keys.js` — the same RSA-2048 keypair generation used in §0.

**Correction (2026-10-21, after reading the recovered code line by line): treat it as reference,
not a port.** It has structural problems beyond the §4 unknowns:
- `createPayment()` POSTs the signed fields to the gateway *from our server* and expects a
  `redirectUrl` back. In this gateway family the **cardholder's browser** submits the signed form
  to the gateway's hosted page; a server-to-server POST of `TRTYPE=1` can't work.
- `verifyCallback()` rebuilds the *request* signing string from the callback fields and verifies it
  with *our* key — wrong field set and (almost certainly) the wrong key (§4).
- It calls `crypto.randomBytes` without importing `crypto` — it would have thrown on first use.

The new implementation is a rewrite that borrows names and TRTYPE codes from it (§12). The exact
protocol still needs the real spec — `developer.azericard.com` still returns 403 to automated
access as of 2026-10-21; someone with the bank relationship needs to obtain the merchant
integration guide.

What's still live and relevant in the current backend:

- `backend/Routes/payment-proxy.routes.js` (559 lines) — checkout flow (`/initiate`, order status,
  order list, cancel). Currently calls out to the **removed** payment microservice via
  `PAYMENT_MICROSERVICE_URL` / `axios`. This needs rewiring to call the integration directly
  in-process (§3) instead of proxying to a service that no longer exists.
- `backend/Routes/Webhook.routes.js` (312 lines) — handles payment success/failure, updates stock,
  credits seller wallet. Written for the old external-service webhook shape; needs to accept
  Azericard's actual callback field names instead (§4/§5).
- `backend/models/Order.js` — already has `paymentOrderId`, `transactionId`, `paymentStatus`,
  `paymentMethod`, `paidAmount`, `walletDeduction`, `onlineAmount`, plus the indexes and
  `markPaymentCompleted()`/`markPaymentFailed()` methods this integration needs. **This model
  does not need schema changes** — it was already designed with this exact integration in mind.
- `backend/models/transaction.model.js` — the wallet ledger (reworked in #191 to be the single
  source of truth, unique `transactionId`, `paymentMode: "Wallet" | "online"`). Card payments
  should write here the same way wallet transfers already do.
- `backend/models/payment.model.js` — a separate, older, loosely-typed collection
  (`String` ids, no `enum` on `status`, no link to `Order`). Flagged in `DB_SCHEMA_AUDIT.md` as
  architecturally redundant with `Transaction`. **Recommend retiring it** rather than building the
  new integration on top of it — see §6.

---

## 2. Scope: payments *and* wallet, how they relate

SATGO already has a wallet (`User.walletBalance`, ledgered in `Transaction`) used for
wallet-to-wallet transfers and partial/mixed payments (wallet + card in one checkout — see
`Order.paymentMethod: "mixed"`). The Azericard integration is the **card-payment leg** that feeds
both:

1. **Direct checkout with a card** → Azericard → money reaches the seller (via the existing
   wallet-crediting pattern, `onlineWalletTransfer`).
2. **Wallet top-up with a card** → Azericard → credits the buyer's own `walletBalance`, which can
   then be spent via wallet-to-wallet transfer or at checkout — this flow doesn't fully exist yet
   and is worth building at the same time, since it's the same Azericard call with a different
   destination.

Both ultimately call the same two things: "create a signed Azericard payment request" and
"verify + process an Azericard callback" — so the plan below builds those two pieces once and
uses them for both flows.

---

## 3. Architecture decision: no separate microservice this time

**Recommendation: build this directly inside `backend/`, not as a revived standalone service.**

Reasons:
- The standalone service's entire failure mode last time was operational — a second PM2 process,
  a second nginx vhost (`payment.satgo.az`, since removed), a second set of secrets, a second
  thing that can silently stop and nobody notices until "why isn't payment working" comes up
  (which is exactly what happened: it crash-looped for an unknown period before anyone caught it).
- There's no PCI-scope reason to isolate it: this is a redirect/callback-based integration
  (SAQ-A style) — card data is entered on Azericard's own hosted page, never touches our servers.
  Process isolation doesn't reduce card-data handling scope here the way it would for a service
  that actually processes card numbers.
- One fewer moving part matches the project's existing direction (`#193` already removed the
  microservice specifically to simplify to "frontend + backend only" — reintroducing a second
  backend service for this would reverse that decision).

Concretely: new code lives under `backend/services/azericard/` (ported/adapted from the recovered
`crypto.service.js` + `azericard.service.js`) and `backend/keys/azericard/` (gitignored, §7),
wired into the existing `payment-proxy.routes.js` and `Webhook.routes.js` (or a renamed
`azericard.routes.js` — naming TBD, not load-bearing).

---

## 4. Protocol details that must be verified before writing the real signing code

The recovered implementation is a reasonable starting point but was written without confirmed
access to Azericard's docs, and these specifics are exactly the kind of thing that silently breaks
signature verification if wrong. **Do not treat the recovered code's values below as correct until
checked against the actual integration guide** (request it from Rabita/Azericard once the public
key in §0 is submitted — these processors almost always send a PDF spec at that point):

| Item | What the old code assumed | What to verify |
|---|---|---|
| MAC/`P_SIGN` field order | `AMOUNT, CURRENCY, ORDER, DESC, MERCH_NAME, MERCH_URL, TERMINAL, EMAIL, TRTYPE, COUNTRY, MERCH_GMT, TIMESTAMP, NONCE, BACKREF` concatenated | Exact field list **and order** per Azericard's spec — get this wrong and every signature fails, silently, until checked |
| `TIMESTAMP` format | `new Date().toISOString()` (e.g. `2026-10-16T12:00:00.000Z`) | Many BORICA-family gateways (Azericard is part of that processing family) actually require `YYYYMMDDHHmmss` (14 digits, no separators) — this is a very common real mismatch |
| Signature encoding | RSA-SHA256, hex, uppercased | Confirm hex vs base64, and case sensitivity |
| Amount minor unit | `Math.round(amount * 100)` (qəpik, 2 decimal places for AZN) | Almost certainly correct for AZN but confirm |
| Return URL vs callback URL | Only `BACKREF` (browser redirect after payment) existed | **The bank's email asks for a separate server-to-server callback URL** — this is likely a distinct parameter (commonly `NOTIFY_URL` / `P_URL` / similar in this gateway family) sent alongside `BACKREF`, not the same field. Confirm the exact parameter name. |
| Callback signing direction | `verifyCallback()` assumed Azericard signs callbacks with *our* key pair | More likely Azericard signs callbacks with **their own** private key, and we verify using **their** public key (which they should provide once test setup is confirmed) — a separate key from the one in §0. Confirm whether a second, Azericard-supplied public key is needed. |
| Test/sandbox gateway URL | Not present in recovered code (`config.azericard.gatewayUrl`, value unknown) | Rabita/Azericard need to supply the test gateway endpoint along with test terminal credentials |
| Required HTTP response to a callback | Not specified | Confirm what Azericard expects back (often a specific plaintext string like `OK` or a specific status code) — getting this wrong can cause the gateway to retry indefinitely or mark the merchant integration as broken |

None of these are guesses I can resolve without the actual spec document or portal access (both
currently blocked on my end — `developer.azericard.com` returned 403 to an automated fetch). This
table is the literal checklist for whoever has the portal access / bank contact to confirm, before
the signing code goes further than "ported from the old version."

---

## 5. Backend work

### 5.1 New/ported files
- `backend/services/azericard/crypto.service.js` — sign/verify, ported from the recovered version,
  reading keys from `backend/keys/azericard/` (or env-var-provided key material in production —
  see §7).
- `backend/services/azericard/azericard.service.js` — request builders + `verifyCallback()`,
  corrected per the §4 checklist once answered.
- `backend/config/azericard.js` — `terminalId`, `merchantName`, `merchantUrl`, `gatewayUrl`
  (test vs prod), all from env vars (new `backend/.env` keys, documented in `.env.example`).

### 5.2 Endpoints
- `POST /api/payments/azericard/initiate` — replaces the current proxy-to-microservice call in
  `payment-proxy.routes.js`; builds the signed request, creates/updates the `Order` with
  `paymentOrderId`, returns the redirect URL (or the raw signed form fields, depending on whether
  Azericard uses a redirect or an auto-submitting form — confirm in the spec).
- `POST /api/payments/azericard/callback` — the URL given to the bank in §0. Verifies `P_SIGN`
  (**reject anything that doesn't verify — do not process unsigned/invalid callbacks**), looks up
  the `Order` by `paymentOrderId`, and:
  - on success: `order.markPaymentCompleted()`, then credit the destination wallet (seller, or the
    buyer's own wallet for a top-up) via the **same ledgered path** described in §6, not a direct
    `walletBalance` mutation.
  - on failure: `order.markPaymentFailed(reason)` — note this currently has a real bug
    (`paymentMetadata` is referenced but not in the schema, so the reason is silently dropped;
    worth fixing alongside this work, see `DB_SCHEMA_AUDIT.md` item 2).
  - **Idempotency**: a webhook can be retried by the gateway. `Transaction.transactionId` is
    already `unique` (#191), so a retried callback attempting to write the same transaction again
    should fail cleanly rather than double-credit — verify this path is actually hit (i.e. check
    for an existing `Transaction` for this `paymentOrderId`/`transactionId` before writing, don't
    rely solely on the unique-index error as the only guard).
- `GET /api/payments/azericard/order/:orderId` — status polling, already exists in
  `payment-proxy.routes.js`, needs its backing call rewired the same way as `/initiate`.
- `POST /api/wallet/top-up/azericard` (new) — same signing/redirect flow as checkout, but the
  callback credits `req.user`'s own wallet instead of an order's seller. Could share almost all
  code with the checkout flow via a `destination: { type: "order" | "wallet", ... }` parameter
  rather than being fully separate code paths.

### 5.3 Fixes to make while touching this code
- `payment-proxy.routes.js` / `Webhook.routes.js`: multiple direct `buyer.walletBalance -=` /
  `seller.walletBalance +=` mutations with no `Transaction` row written (flagged in
  `DB_SCHEMA_AUDIT.md`'s "known gap"). Replace every one of these with a call through a single
  `creditWallet(userId, amount, meta)` / `debitWallet(...)` helper that does the balance update
  and the `Transaction` write together (ideally in one Mongoose session, matching the pattern
  `transaction.controller.js`'s `walletTransfer` already uses) — so card-payment wallet changes
  and existing wallet-transfer wallet changes are never divergent code paths again.
- Retire `backend/models/payment.model.js` once nothing writes to it — or at minimum give it an
  `orderId` field and bring its field types in line with the rest of the schema, per
  `DB_SCHEMA_AUDIT.md`.

---

## 6. Wallet ledger consistency

This integration is the forcing function to finish what #191 (the `Transaction`-as-single-ledger
refactor) started but didn't fully reach: `Order`-driven wallet changes
(`payment-proxy.routes.js`, `Webhook.routes.js`) still mutate `walletBalance` directly without a
matching `Transaction` row. Once Azericard payments are flowing through this same code, every
wallet balance change in the system — transfers, card-funded purchases, card-funded top-ups,
refunds — should go through the same ledgered path. This makes `GET /users/:id/transactions`
(already correct, per #191) a complete and trustworthy history, which matters for exactly the kind
of bank/compliance review this whole engagement has been about.

---

## 7. Security

- **The RSA keypair generated in §0 must never be committed to git.** This isn't hypothetical —
  the *previous* Azericard integration's private key was committed to this repository
  (`ed2ef65`, "initial micro service model") and, because history was never rewritten, is still
  sitting in this **public** GitHub repo's history today. That's why this plan generates a
  completely fresh pair rather than reusing anything recoverable from history. If that old key was
  ever actually submitted to Azericard for a live/test terminal, it should be treated as
  compromised and the bank should be told to deactivate it, independent of this new integration.
- Private key storage: for local dev, `backend/keys/azericard/private.pem` (gitignored, confirmed
  in §0). For production, don't ship the `.pem` file through git or the `production/*` deploy
  branches at all (those branches force-add `Frontend/dist` but backend source only — the key
  should never enter that flow) — place it directly on the server filesystem (matching how
  `backend/.env` itself is already handled: present on the server, gitignored, never deployed
  through git) or read key material from an env var instead of a file path, so it's provisioned
  the same way as every other backend secret already is.
- Verify `P_SIGN` on **every** incoming callback before trusting any field in it — no exceptions,
  including during testing (a weakened "skip verification for now" dev mode is exactly the kind of
  thing that accidentally ships).
- Rate-limit the callback endpoint (the project already has `rateLimiter.middleware.js` patterns
  to reuse) and log every callback attempt, valid or not, for audit purposes — do not log the
  signature or key material itself.
- If Azericard publishes a fixed set of server IPs that callbacks originate from, add IP
  allowlisting on top of signature verification as defense in depth (not a replacement for it).

---

## 8. Frontend work

- Checkout flow (`PaymentDialog.jsx` / `Checkout.jsx`, per earlier review) needs to handle a
  redirect-based flow: send the user to Azericard's hosted payment page, handle the return
  (`BACKREF`) landing back on a SATGO page that polls `/api/payments/azericard/order/:orderId`
  for final status (since the authoritative result comes from the server-to-server callback, not
  the browser redirect, which can be skipped/closed by the user).
- New wallet top-up UI (`TransactionHistory.jsx` already has "Add Money"/"Withdraw Money" buttons
  per earlier review — wire "Add Money" to the new top-up endpoint).
- i18n: any new user-facing payment status text (processing / success / failed) should go through
  the existing `translation.json` pattern (en/az/ru) used throughout this project.

---

## 9. Testing plan

1. Confirm sandbox/test gateway URL and test terminal credentials from Rabita/Azericard (part of
   what they send back after receiving §0's callback URL + public key).
2. Unit-test `crypto.service.js` sign/verify against Azericard's documented test vectors, if they
   provide any (common for this gateway family) — catches field-order/format mistakes (§4) before
   ever hitting the sandbox.
3. End-to-end in sandbox: initiate → redirect → test card → callback received → signature verifies
   → `Order` updated → `Transaction` written → wallet balance correct → idempotency check (replay
   the same callback manually, confirm no double-credit).
4. Failure paths: declined card, expired session, malformed/unsigned callback (must be rejected),
   callback for an unknown `paymentOrderId`.
5. Load/rate-limit check on the callback endpoint.

Only after all of this passes in sandbox should production terminal credentials be requested and
go-live be considered.

---

## 10. Deployment

Fits the existing pipeline documented in `DEPLOYMENT.md` — no new infrastructure needed given the
"no separate microservice" decision in §3:
- Code ships through the normal `main-2` → PR → `deployment` cherry-pick →
  `scripts/deploy-production.sh` → server checkout → `pm2 reload` flow already in use throughout
  this engagement.
- The only genuinely new manual step: placing `backend/keys/azericard/private.pem` (or the
  equivalent env var) on the server directly, once, the same way `backend/.env` already is —
  **not** through git.
- `api.satgo.az` already has valid SSL and is already the domain given to the bank in §0, so no
  nginx/DNS changes are needed to support the callback URL itself.

---

## 11. Open items / what's blocking real implementation

1. **Azericard integration guide / portal access** — `developer.azericard.com` is blocked to
   automated access from here (403); someone with a browser and the bank relationship needs to
   pull the actual spec PDF to resolve every row in §4's table. This is the single biggest blocker
   to writing signing code that will actually work on the first try with Azericard's systems.
2. **Confirmation from Rabita/Azericard** once §0 is sent: test gateway URL, test terminal ID,
   whether a separate "Azericard's public key" is needed for callback verification (§4).
3. **Decision**: is wallet top-up via card in scope for the first release, or checkout-only first?
   (Plan above supports either order, since both share the same underlying service.)

---

---

## 12. Build plan (added 2026-10-21)

### 12.1 What the current code actually does (found while planning)

| # | Finding | Where | Impact |
|---|---|---|---|
| A | Frontend card checkout posts to `/api/payment/create`, which lives in `Routes/paymentroutes.js` — **never mounted** in `Routes/index.js`. | `Frontend/src/pages/PaymentDialog.jsx:354` | Card checkout from the UI 404s today. The real backend endpoint `/api/payments/initiate` has **no frontend caller**. The two halves were never connected. |
| B | `/initiate` takes `buyerId` from the request **body**, not the JWT. | `payment-proxy.routes.js:21` | Any logged-in user can spend another user's wallet balance by putting that user's id in the body. **Security bug, fix first.** |
| C | Wallet-only checkout: frontend calls `/api/transaction/transferFund`, then creates the order itself via `POST /orders` with a client-supplied transaction id. | `PaymentDialog.jsx:194-300` | The order record is trusted from the browser; payment and order creation are not atomic. |
| D | `/initiate` and `/cancel` mutate `walletBalance` directly (wallet-only path, mixed deduction, refund-on-failure, cancel refund) with no `Transaction` row. | `payment-proxy.routes.js:179,197,224,274,545` | Ledger gap from §5.3 — balances can change with no history. |
| E | `Order` writes `paymentMetadata`, but the field is commented out of the schema. | `models/Order.js` | Failure reasons and audit data silently dropped (strict mode). |
| F | `/cancel` refunds the full `paidAmount` — including the **card** portion — to the buyer's **wallet**. | `payment-proxy.routes.js:543` | Card money silently becomes wallet credit. Needs a policy decision (§12.4). |
| G | `Webhook.routes.js` is not mounted; `onlineWalletTransfer()` in `transaction.controller.js` is correct and session-aware. | — | Reuse `onlineWalletTransfer`; retire `Webhook.routes.js`. |

### 12.2 Phases

Phases 1–3 need **nothing** from the bank and can start now. Everything stays behind
`AZERICARD_ENABLED` (already in place, #199), so nothing reaches users until Phase 5.

**Phase 1 — Fix the foundations (no gateway code). ~2–3 days**
1. `/initiate`: take `buyerId` from `req.user`, ignore the body field (finding B).
2. New `backend/services/walletLedger.js`: `debitWallet(userId, amount, meta, session)` /
   `creditWallet(...)` — balance `$inc` (with a `walletBalance >= amount` guard on debit) **and** the
   `Transaction` row in the same Mongo session. Replace every direct mutation from finding D.
3. Make wallet-only checkout server-side: `PaymentDialog` calls `/api/payments/initiate` for every
   checkout; the existing wallet-only branch in `/initiate` creates the order, debits, decrements
   stock and credits the seller in **one session**. Stop client-side order creation (finding C).
4. Restore `paymentMetadata` in the `Order` schema; add `gateway: { rrn, intRef, approval, rc,
   action, callbackAt }`. Add a **unique** index on `paymentOrderId` (sparse).
5. Delete the dead paths: `Routes/paymentroutes.js` + its controller/validator, `Webhook.routes.js`,
   the axios-to-`localhost:3001` code and the `PAYMENT_SERVICE_*` / `PAYMENTWALL_*` env vars.
6. Tests for the above (Jest is already set up in `backend/tests/`).

Shippable on its own. It fixes a live security bug and the ledger gap even if Azericard slips.

**Phase 2 — Azericard module, built against a pluggable signer. ~3–4 days**
```
backend/services/azericard/
  config.js     terminal, merchant name/url, gateway URL, key paths — all env vars
  signer.js     buildSignString(fields, fieldOrder) + sign() with OUR private key
                + verify() with AZERICARD's public key
  gateway.js    buildPurchaseForm(order), parseCallback(body), buildStatusRequest(), buildRefund()
  orderId.js    gateway-safe ORDER ids (these gateways usually restrict length/charset)
```
- Every §4 unknown (field order, empty-field encoding, TIMESTAMP format, hex vs base64,
  callback field set) lives in **one constant table in `signer.js`**. When the spec arrives, only
  that table and the test fixtures change.
- `signer.test.js`: round-trip tests now; Azericard's published test vectors once we have them.
- No "skip verification" switch, not even for dev (§7).

**Phase 3 — Wire checkout + callback. ~3–4 days**
- `POST /api/payments/initiate` (card or mixed): validate → create `Order` (`processing`) → debit the
  wallet portion through `walletLedger` → return `{ gatewayUrl, fields }`. **No server-side POST to
  the gateway.**
- Frontend: `PaymentDialog` builds a hidden `<form method="POST" action={gatewayUrl}>` from `fields`
  and submits it, so the browser lands on Azericard's hosted card page.
- `POST /api/payments/azericard/callback` (public, no JWT):
  1. urlencoded body parser on this route only; rate limit; log every hit (never log `P_SIGN`).
  2. Verify `P_SIGN` → reject if invalid.
  3. Find the order by `paymentOrderId`; check `AMOUNT`, `CURRENCY` and `TERMINAL` match what we
     sent.
  4. **Idempotent state transition**: `findOneAndUpdate({ _id, paymentStatus: 'processing' }, ...)`.
     A retried callback finds nothing to update and gets the same success reply.
  5. Success → in one session: mark order paid, decrement stock (`$inc` guarded by `stock > 0`),
     credit the seller via `onlineWalletTransfer()` (`transactionId` derived from gateway RRN).
     Out of stock at this point → mark for refund and alert (rare; same-item race).
  6. Decline → mark failed, refund the wallet portion through `walletLedger`.
  7. Reply exactly as the spec requires (§4).
- `BACKREF` → new frontend page `/payment/result/:orderId` that polls
  `GET /api/payments/order/:orderId`. The browser return is **never** treated as proof of payment.
- **Reconciliation job** (cron, like the payment monitor): orders stuck in `processing` for more than
  20 min get a `TRTYPE=90` status check. Resolve them, or expire them and refund the wallet portion.
  This covers lost callbacks and users who close the tab.
- i18n (en/az/ru) for processing / success / declined / unavailable.

**Phase 4 — Sandbox testing (needs bank data, §9). ~1 week elapsed, mostly waiting**
Run the §9 checklist end to end, plus: callback replay (no double credit), tampered callback
(rejected), amount mismatch (rejected), tab closed before return (reconciliation resolves it).
Update `monitor-payment-integrity.js`: once enabled, alert on "card order completed **without** a
matching ledger `Transaction`/verified callback" instead of "any card order completed".

**Phase 5 — Go live**
Place `private.pem` and Azericard's public key on the server by hand (never via git, §7). Set the
production terminal env vars and `AZERICARD_ENABLED=true`. Deploy through the normal pipeline.
Watch the first real transactions and the monitor for 48h.

**Phase 6 (optional) — Wallet top-up by card.** Same module, with destination = buyer's own wallet
(§2). Roughly 2 days once Phase 3 exists.

### 12.3 What we need from Rabita Bank / Azericard (blocks Phase 4, not Phases 1–3)
1. Merchant integration guide (PDF or portal login) — resolves every row in §4.
2. Test gateway URL, test `TERMINAL` id, merchant name/URL as registered on their side.
3. **Azericard's public key** for verifying callbacks (if callbacks are RSA-signed by them).
4. Test card numbers, and callback source IPs if they publish them (§7 allowlist).
5. Confirmation that any key from the old integration (commit `ed2ef65`, exposed in public git
   history) is **not** active on any terminal.

### 12.4 Decisions needed from the business
1. **Card refunds** (finding F): back to the card through the gateway (`TRTYPE=22/24`), or to SATGO
   wallet credit? Recommendation: refund to card by default. The Refund & Cancellation Policy page
   (#194) should match whatever is chosen.
2. **When the seller gets paid**: today the seller's wallet is credited immediately at payment.
   `Order.status` already has `released`. Holding funds until delivery is confirmed (escrow) is
   safer for a marketplace and fits the existing buyer delivery-confirmation fields. It also
   changes step 5 of the callback, so decide before Phase 3.
3. **Top-up in the first release** or checkout only? (§11.3)

### 12.5 Order of work
Phase 1 (separate PR, ship immediately) → Phase 2 + 3 (one PR, merged with the flag off) → bank
data arrives → fix the signer table → Phase 4 → Phase 5.

---

## Summary of what to do right now

1. ~~Send Rabita Bank the callback URL and public key from §0.~~ Done.
2. Ask Rabita/Azericard for the items in §12.3.
3. Decide §12.4 (refund destination, seller payout timing, top-up scope).
4. Start Phase 1 (§12.2). It fixes a live security bug and needs nothing from the bank.
