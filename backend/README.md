# Math Help backend — prepared, not deployed

Cloudflare Workers Free with one SQLite-backed Durable Object. GitHub Pages remains the frontend. Do not enable a paid Cloudflare plan for this project without approval.

## Connect securely

From this folder, after signing into your personal Cloudflare account:

1. `npm ci`
2. `npx wrangler login`
3. `npx wrangler deploy` (the endpoint refuses all AI requests until both secrets exist)
4. `npx wrangler secret put OPENAI_API_KEY` — paste your dedicated project key only into the hidden terminal prompt, never chat or source.
5. `npx wrangler secret put TUTOR_ACCESS_CODE` — enter a distinct random family code of six letters (case-sensitive); longer codes also work. This is not the API key.
6. Set `window.MATH_TUTOR_ENDPOINT` in `../tutor-config.js` to the returned HTTPS Workers URL followed by `/help`.
7. Test an authenticated arithmetic question, an unrelated question, and an incorrect access code. Then commit and push frontend changes.

The Cloudflare dashboard's Worker Settings → Variables and Secrets is an alternative place to enter the two values as **Secret** variables. Never put them in ordinary Variables, GitHub, or the game page. The family code can then be entered by a parent in the game’s unlock field. It is not persisted in browser storage.

## Budget

Approved ceiling: $5/month for this tutor. Model is pinned to `gpt-4.1-mini-2025-04-14`; verified rates on 2026-10-04 are $0.40/M input and $1.60/M output tokens. Input is a fixed instruction plus tiny canonical arithmetic JSON (no raw user text), and output is limited to 350 tokens. Each call reserves a deliberately conservative 1 cent, with 500 reservations per UTC calendar month, 50/day, and 5 seconds between calls. Failed and timed-out requests keep their reservation, and there are no automatic upstream retries. The ledger uses a durable atomic transaction before each call.

This is a conservative request allowance, not a reading of your OpenAI invoice. It applies only to this backend and these verified model rates; other uses of the same key/account, provider price changes, taxes, and paid hosting are outside it. Use a dedicated API project/key. Recheck pricing before changing model or token limits. Do not delete, roll back, duplicate, or rename the production budget object; that would reset or split the allowance.

## Scope and privacy

The server accepts only whole-number arithmetic (0–1,000), four named arithmetic concepts, and a limited set of current-problem questions/hints. Off-topic and mixed requests are refused before billing. The model receives only canonical numbers, operations and intent, not raw input or screenshots. `store:false` disables stored Responses; this does not promise zero provider retention. No application request logging is enabled.

The model generates short explanations. Output has length and link/HTML checks and is rendered as text, but these checks cannot guarantee every generated word or calculation is correct. Input scope is enforced; model output still requires evaluation. Do not advertise unrestricted natural-language tutoring or guaranteed AI correctness.

## Verification so far

`node --test tests/*.test.*` from the project root passes 15 tests, including mocked API tests. No real key or live request has been used. Cloudflare deployment validation was blocked because access to its local configuration directory was not granted. Complete deployment validation and a real API smoke test before enabling the endpoint in the frontend.
