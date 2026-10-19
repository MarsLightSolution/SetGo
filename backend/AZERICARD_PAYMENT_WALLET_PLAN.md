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

**This logic needs review, not a rewrite** — see §4 for exactly what needs verifying against the
real spec before it can be trusted, since it was written once before without confirmed access to
Azericard's actual documentation (same 403 block I hit trying to reach
`developer.azericard.com` just now — someone with portal access needs to pull the real merchant
integration guide PDF, which Azericard/Rabita typically provide once the public key is submitted).

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

## Summary of what to do right now

1. Send Rabita Bank the callback URL and public key from §0.
2. While waiting on their response, request the actual Azericard merchant integration guide /
   confirm portal access, to resolve §4.
3. Once both are in hand, implement per §5–§6, test per §9, deploy per §10.
