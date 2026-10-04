# Math Game

Play at https://kedar-labs.github.io/math-game/.

A buildless HTML/CSS/JavaScript game: ten correct answers reveal a mystery picture. Four operations, 10/20-second timers, review cards, sound, and fresh-round reset are preserved. Images and sounds retain their original Google Cloud Storage URLs.

## Preview and test

Run `python3 -m http.server 8766 --bind 127.0.0.1` here and open http://127.0.0.1:8766/.

Run `node --test tests/*.test.cjs`. These are logic tests using a small DOM harness; they do not replace browser layout/audio testing.

GitHub Pages deploys the root of `main`. Commit and push edits to publish; no build is required. The ignored `dist/` and `.openai/` folders belong to an earlier unused hosting setup, not the live deployment.

## Files

- `index.html`: layout and accessible text
- `styles.css`: responsive rainbow/dumpling design
- `game.js`: questions, timers, reveal, history, and media
- `math-help.js`: bounded, local arithmetic explanations; not an AI service
- `assets/`: generated dumpling header and locally hosted Fredoka/Nunito fonts, with font licenses
- `tests/`: game lifecycle and arithmetic helper checks

## Math Help and planned AI connection

The side panel currently uses local arithmetic templates. It understands the current game problem, basic calculations, and four arithmetic concepts. Other inputs receive a fixed arithmetic-only response. It does not contact OpenAI, use a microphone, or store chat messages. The game timer continues while using it.

The user approved planning an API tutor with a $5/month budget. No API key or live API billing is configured. To connect it safely:

1. Set up a dedicated project and API billing at https://platform.openai.com/; API billing is separate from ChatGPT subscriptions.
2. Create a project API key and store it only as a secret on the selected backend host. Never paste it in chat, browser JavaScript, GitHub files, or localStorage.
3. Add a backend endpoint. GitHub Pages serves static files and cannot hold a private key or run this endpoint.
4. Restrict access, cap input/output length and request rate, and maintain a persistent monthly usage ledger. Reserve a conservative maximum request cost before each call and stop before $5. Platform project budget alerts alone must not be treated as a hard stop. Model pricing, host costs, and authentication need confirmation before deployment.
5. For an enforceable math-only scope, use a small allowed set of math intents and validated numeric arguments, with deterministic explanations/refusals. An unrestricted model plus a prompt is not a guarantee. Broader AI-generated explanations require separate input/output checks and adversarial tests, with residual risk made clear.
6. Send structured problem context (numbers and operation), not screenshots, personal data, or arbitrary page contents. Keep voice for a later iteration.

## Visual direction

Inspired by the supplied rainbow mystery-dumpling packaging, with substantially less visual density. Fredoka provides rounded display lettering; Nunito provides readable controls and body text. These are style matches, not claims to identify the exact packaging fonts. All visible wording is HTML text and retains the title “Math Game”.

`assets/dumpling-trio.png` was generated with the built-in Image Generation tool. Prompt: “Clean polished illustration of exactly three smiling squishy dumpling characters in a shallow bamboo steamer: sky blue, pale lemon yellow, and soft pink; rounded plump forms, glossy black eyes, rosy cheeks, pinched tops, soft 3D collectible-toy appearance, a few tiny star sparkles, transparent background, wide composition, no packaging, lettering, logos, or watermark; use the supplied packaging as style reference only.”
