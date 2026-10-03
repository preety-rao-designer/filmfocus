# FilmFocus progress

**Live URL:** (not yet)
**Current phase / step:** Launch. L1 done (Vercel + Firebase verified). Next: L2 card store, L4 on-demand cards, L5 votes, L6 analytics, L3 catalogue growth (quota-paced), L8 preview → C3.

## Waiting for Preety
Nothing right now. Next stop is C3 (the preview deploy).

**A decision for later (C5, money; I won't do this):** on the free tier, the live app can serve roughly **500 searches a day** in total, since each search uses one call on each of the two Flash-Lite models. Growing the catalogue to 1,000 titles at Launch (L3) also needs about two days of quota. If that's too tight for a public test, the option is enabling billing on your Gemini key. That's your call, at Launch.

## Log

### Phase 0 — Setup check (2026-10-01)
- **Bar:** the machine can run the whole autopilot without pausing for setup.
- **Reference:** docs/RUNBOOK.md Phase 0.
- **Limits:** never read or print `.env` values; only check whether each one is filled in.
- **Check:** tool versions and `gh auth status` run successfully; each key is filled in and answers a test request.

Results:
- Node v24.21.0, npm 11.19.0, git 2.50.1: OK.
- GitHub CLI: logged in as `preety-rao-designer`: OK.
- `.env` exists, but GEMINI_API_KEY, TMDB_API_KEY, TAVILY_API_KEY, REDDIT_*, SUPABASE_* are all **empty**. No requests sent. As the runbook says, I'm continuing through Phase 2 and will raise C0 at the start of Phase 3.
- PROGRESS.md created from the template.

### 1.1 Read and restate (2026-10-01)
- **Bar:** S3, the film card, in "The Single Screen" language. Nothing else exists, not even stubs.
- **Reference:** docs/PRD.md, docs/DESIGN_DIRECTION.md.
- **Limits:** restate in my own words; no code.
- **Check:** type scale, spacing rhythm, hierarchy and state signalling are all written down below.

**Type scale.** Two families, each with one job. Rozha One (display) is only for the film title and the one input headline. Mukta does everything else at 400/500/700, with tabular figures wherever numbers sit side by side. Sizes (mobile/desktop): 14 caption, 16 body, 18 lead, 22 section, 32/36 card title, 44/56 input headline. Display line height is 1.1 and body is 1.5. Sentence case everywhere: no caps labels, no eyebrows, no mono.

**Spacing rhythm.** A 4px base, using only 4, 8, 12, 16, 24, 32, 48 and 64. Tight steps (4–8) group things that belong together, like the title and its facts line. 16–24 separates card sections. 24 is the gap between tickets. 48–64 is for page-level air. Desktop content sits in a centred column up to 720px.

**How hierarchy is built.** It comes from size and weight, never color. The title (Rozha One, 32/36) names the show. The honest read "In the hall" (Mukta 500, 18px) is the most prominent content and the biggest thing after the title. The counterfoil "On the poster" is deliberately smaller and lighter so the read wins. Facts are a quiet 14px line. The arc line is the one bold graphic and the only place the card spends boldness. Everything else (tone bar, ending, bandwidth, why, where) is 14–16px supporting text in ink on ticket paper.

**How state is signalled.** Always in words, never by color alone. Limited confidence is one small line ("Based on limited reactions."), not a badge. The spoiler reveal is a collapsed button whose label says what happens ("Read how it ends"), with `aria-expanded`. Loading keeps the exact layout and ticket paper, with soft placeholder bars where the text goes, so nothing moves when data arrives. Series status (ended/ongoing) is written out. The tints (rose, mint, marigold) are pick identity, never meaning.

### 1.2 Scaffold (2026-10-01)
- **Bar:** the smallest Vite + React + Tailwind project that renders the card in "The Single Screen" tokens.
- **Reference:** docs/DESIGN_DIRECTION.md (palette, type, spacing, shape).
- **Limits:** JavaScript only; no router, state library or extra pages; tokens named curtain, screen, ink, rose, mint, marigold, brass; nothing outside the direction.
- **Check:** the dev server renders; `npm run snap` writes 390/1280 × light/dark snaps.

Done: Vite 5, React 18, Tailwind 3. `tailwind.config.js` replaces Tailwind's default palette, spacing, radii and shadows, so only the direction's tokens exist: the colors, a type scale (caption, body, lead, section, title, title-lg, headline, headline-lg), 4px-rhythm spacing, `rounded-ticket`, `rounded-pill` and `shadow-ticket`. Fonts come from Google Fonts with the direction's fallback stacks, plus Noto fallbacks for regional scripts. `scripts/snap.js` starts its own Vite server and uses Playwright. Verified: four snaps are written.

### 1.3 Mock cards (2026-10-01)
- **Bar:** three honest mock cards in the exact card shape.
- **Reference:** docs/CARD_SCHEMA.md.
- **Limits:** real, well-known titles; no invented fields; anything I can't confirm is null or empty.
- **Check:** every field matches the schema, and the facts were checked on the web.

Done: `src/mocks/cards.js`, with 3 Idiots (movie, TMDB 20453, 171 min), Scam 1992 (series, TMDB 111188, 1 season, 10 episodes, ended, Sony Liv) and Court (limited confidence, TMDB 290815, 116 min). Facts were checked against TMDB, JustWatch India, Wikipedia and search results.

### 1.4 Design the card (2026-10-01)
- **Bar:** `FilmCard`, the full ticket anatomy in "The Single Screen", with Movie, Series and Loading variants.
- **Reference:** docs/DESIGN_DIRECTION.md "The film card".
- **Limits:** one props-driven component; nothing stubbed; identical layout across variants; only direction tokens; footer actions inert except the spoiler reveal.
- **Check:** snap and compare section by section against the anatomy list.

Done: `src/components/FilmCard.jsx`. The counterfoil sits on top on mobile and on the left (176px) on desktop. Brass dot perforation in SVG, with page-colored notches. The honest read comes with a truth line. Title and facts. The arc line (six hand-tuned paths, a non-scaling 2.5px Curtain stroke). The tone bar in shades of Ink, with word and % labels. Ending and bandwidth pairs. Why this fits. Where to watch. Footer pills, with a working spoiler toggle (`aria-expanded`). The limited-confidence line.

### 1.5 Self-review against the direction (2026-10-01)
- **Bar / Reference / Limits:** as in 1.4. **Check:** list every mismatch with measured values; fix; snap again until the list is empty.

Round 1 mismatches:
1. Desktop: the vertical perforation dots were missing. Both SVGs shared one pattern ID, and the one that got used was inside the hidden SVG. Fixed with separate IDs.
2. Loading: placeholder bars didn't wrap and ran up to 120px past the ticket edge at 390px. Rebuilt them as inline blocks sized in `ch` and capped at 100%. Re-measured: 0 elements cross the ticket edge at 390 or 1280.
3. The facts line broke inside "9.2 on / IMDb". Each fact is now kept on one line.
4. The limited-confidence line hadn't been reviewed. Court is now on the page too.

Round 2: honest read 18px/500 vs counterfoil 16px/400 vs title 32px Rozha One, so the read leads the content as specified. The arc has no axes, grid or dots. Only Rozha One and Mukta load. The only shadow is `shadow-ticket`, and the only radii are 14px (ticket) and pill. List empty.

### 1.6 Polish pass (2026-10-01)
The impeccable skill isn't installed, so I ran the checklist myself:
- Hierarchy at a glance: read → title → arc → the rest. OK.
- Spacing: every gap is on the 4px scale (4/8/12/16/24/32). The only off-scale values centre the 10px dot row in the 24px perforation (7px), which is internal alignment. OK.
- Type: sentence case throughout; tabular figures on facts, tone % and weight. OK.
- Variants: the Loading card keeps every label and pill, so it reads as "the same ticket, filling in". OK.
- Keyboard focus: a 2px Curtain outline with a 2px offset, checked on the first focusable button. OK.
- Contrast: Ink on rose 11.2:1, mint 12.8:1, marigold 11.8:1, so every text passes AA (AAA in fact). Disabled pills during Loading sit at 50% (disabled controls are exempt).
- Reduced motion: nothing animates in Phase 1.
- Intentional vs generic: **changed** the arc's three words from flex space-between to a three-column grid, so the middle word sits under the middle of the curve whatever the word lengths.

### 1.7 → C1
Stopped for design sign-off (see "Waiting for Preety").

### 1.7 → C1: approved (2026-10-01)
Preety replied "approved for now". Approved snaps copied to `docs/design/approved/`.

### 2.1 Carry the language forward (2026-10-01)
- **Bar:** S1 and S2 speak the approved card's language: same tokens, type and spacing; no design system beyond the Tailwind tokens.
- **Reference:** `docs/design/approved/`, docs/DESIGN_DIRECTION.md.
- **Limits:** no new tokens; Rozha One only for the S1 headline and film titles; pills are the only rounded controls.
- **Check:** every class on S1/S2 resolves to an existing token (Tailwind has no defaults to fall back on, so an unknown class simply wouldn't render).

### 2.2 Design S1, Mood input (2026-10-01)
- **Bar:** S1 per the direction's "Screens": headline, text box, a row of optional chips, "Find my three", "Surprise me".
- **Reference:** approved card snaps + direction.
- **Limits:** nothing else on the screen; chosen state in words and fill, not hue; 390px first.
- **Check:** snap populated (typed + chips tapped) at 390/1280, light/dark; every element traceable to the direction.

Round 1: three labelled chip groups (13 pills) read as a form, and the direction asks for "a row of optional pill chips". **Changed** to one row of three chips (Who's watching / How long / Stay in this mood or shift it). Tapping one opens its answers under the row, and a chosen chip shows the answer in words ("With family") as a filled Ink pill with `aria-pressed`.
Round 2: at 1280 the 56px headline left "for?" alone on line 2. **Fixed** with `text-wrap: balance`. List empty.

### 2.3 Design S2, Results (2026-10-01)
- **Bar:** three FilmCards on rose, mint and marigold with "Show me three others", reading as one layout.
- **Reference:** approved card snaps.
- **Limits:** FilmCard reused unchanged; no loading variant, refine chips, follow-up, watchlist or compare.
- **Check:** snap at 390/1280, light/dark; tickets 24px apart; one control below.

Done: a "For “…” · With family · One movie · Comfort me" line with "Change my mood" above the tickets, the three tickets (`gap-6`, 24px), and a Curtain pill "Show me three others" 32px below.
Round 1: the three "why this fits" lines were near-identical templates. **Changed** the mock to end each line with that card's own `good_for`. List empty.

### 2.4 Plan the build (2026-10-01)
- **Bar / Reference:** a small running app from S1 + S2; response shape from docs/CARD_SCHEMA.md.
- **Check:** the plan names both screens, the shared component, where state lives and the build order, before any code.

Plan (written here instead of in plan mode, because plan mode stops for approval and the runbook says not to stop outside checkpoints):
- **Screens:** S1 `src/screens/MoodInput.jsx`, S2 `src/screens/Results.jsx`, plus `src/components/Header.jsx`. Shared: `FilmCard`, unchanged.
- **Navigation:** no router. The path picks the screen (`/` or `/results?q=…&company=…&time=…&shift=…`), with `history.pushState` and `popstate`, so back/forward and reload all work and S2 can be snapped directly.
- **State:** all in `App.jsx` (text, chips, picks, ids seen). Screens are props-only.
- **Engine:** `src/engine/mock.js` `recommend({ text, chips, exclude })`, async and returning exactly `{ followup, picks: [{ card, why_this_fits }], understood }`. The store is `src/mocks/catalogue.js` (12 cards).
- **Works by the end:** navigation, Find my three, Surprise me, Show me three others (cycles all 12), spoiler reveal. **Inert:** watchlist, compare, where-to-watch links.
- **Order:** S1 → S2 → shell → first commit → engine → flow → verify → commit.

### 2.5 Shell, 2.6 First commit (2026-10-01)
- **Check:** dev server runs, both screens reachable, nothing dead-ends.
Done: S1 → Find → S2; S2 → "Change my mood" or the FilmFocus wordmark → S1 (keeping what was typed); the browser back button works. `.gitignore` covers `.env` (confirmed with `git check-ignore .env`), `node_modules`, `dist` and `docs/design/snaps/`. Staged files were scanned for key prefixes before committing: none.

### 2.7 Happy flow (2026-10-01)
- **Check:** real input gives real, different results on each "show me others".
Done: the mock engine scores the 12 cards on tone words in the text, the stay-or-shift answer, movie vs series, and who's watching (kids → `family_ok` only; family → no `adults_only`). Ties break on a hash of the mood, so different moods order differently. Measured:
- "Rough day, warm but not dumb" + family + movie + comfort → Queen, 3 Idiots, Paddington 2
- "want to be gripped, a twisty thriller" → Scam 1992, Andhadhun, 96
- "feeling low, want a good cry" + let me feel it → 96, Fleabag, Inside Out
- "something to binge" → Scam 1992, Fleabag, Chernobyl
- with kids → Paddington 2, Inside Out, 3 Idiots

### 2.8 Verify and commit (2026-10-01)
`npm run flow` (new, `scripts/flow.js`) starts Vite and, at 390 and 1280, light and dark: checks Find waits for input, types, taps all three chips (checks `aria-pressed`), snaps S1, finds, checks 3 cards, snaps S2, shows others twice (checks 9 different titles), opens a spoiler (checks `aria-expanded`), goes back (checks the text is kept), and fails on any page error. All four passes are OK. Commit `21a8c13` "Happy flow on mocked engine".

### 2.9 One more lap (2026-10-01)
The least deliberate thing: results just popped in, skipping the direction's one animation moment ("Motion": tickets slide up from a thin slot line at the bottom of the header, 80ms apart, 320ms each, ease-out; under reduced motion they simply appear). **Added** exactly that: a 2px Curtain-deep slot line under the header and a `ticket-in` keyframe on each ticket. The flow checks the timings are exactly [320/0, 320/80, 320/160] ms and that no animation runs under `prefers-reduced-motion`. Commit `73842a4`.

### 2.10 The safety net (2026-10-01)
```
73842a4 Results arrive through the counter window
21a8c13 Happy flow on mocked engine
f53bd36 Scaffold, film card and navigation shell
```
`git switch --detach 21a8c13` → snapped S1 → `docs/design/safety-net/s1-at-21a8c13.png` (the pixel under the header is Screen: no slot line yet). `git switch main` → snapped again → `docs/design/safety-net/s1-at-73842a4.png` (the pixel under the header is Curtain deep: slot line present). No `reset --hard`.

### 3.1 Branch, 3.2 Keys (2026-10-01)
On `phase-3-live-engine`. `git check-ignore .env` → ignored by `.gitignore:1`; `.env` appears in no commit on any branch. `.env.example` (names only) was already in the kit and is committed. Keys: Gemini, TMDB and Tavily answer real requests (HTTP 200).

### 3.3 + 3.4 Server side and engine plan (2026-10-01)
- **Bar:** recommendations come from a real card store, through server-side functions only; the screens don't change except for the 3.7 states.
- **Reference:** docs/PRD.md "How cards get made" / "How matching works", docs/CARD_SCHEMA.md (every rule), docs/EVAL_MOODS.md.
- **Limits:** keys only in `.env`, read server-side; the browser only calls `/api/*`; picks only from `data/cards.json`; free tiers only, throttled, every raw response cached, runs resumable.
- **Check:** typing real moods returns real store picks that differ by mood; `npm run eval` meets the pass bar.

**Models (confirmed 2026-10-01 from ai.google.dev/gemini-api/docs/models and the key's own ListModels):** card writing and reranking use `gemini-3.8-flash`, falling back to `gemini-3.7-flash` → `gemini-3.6-flash` on 503/429. Both newer ones were returning "high demand" 503s at test time; 3.6 answered. Mood parsing uses `gemini-3.5-flash-lite` (→ `gemini-3.1-flash-lite`). Embeddings use `gemini-embedding-2` at 768 dimensions. Strict JSON uses `responseMimeType: application/json` plus a `responseSchema`, tested and working.

**What changes:** a new `api/` (Vercel-style `export default function handler(req, res)`), a small Vite plugin that serves `api/*` in dev, `scripts/pipeline/`, `data/`, and `src/engine/live.js` (a `fetch('/api/recommend')` with the same call as the mock). **What stays the same:** both screens, FilmCard, the response shape, and the mock engine (kept for tests).

**Card pipeline** (`node scripts/pipeline/run.js`, resumable, one title at a time with small concurrency):
1. `seed.js` picks 300 titles from TMDB discover (India region, flatrate providers, by vote count): about 120 Hindi, 90 regional (Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi), 90 English/international; about 75 series. Writes `data/seed.json`.
2. Per title: TMDB details, external ids, India watch providers, release dates/content ratings, keywords; Wikidata by TMDB id (P4947 film / P4983 series) for "based on" (P144) and "main subject" (P921), plus whether it's a biographical film; Wikipedia plot and reception sections (the English article, via the action API); Tavily search for audience reactions (about 5 results). Every raw response is cached in `data/cache/` (git-ignored, because it holds third-party text).
3. Gemini writes only the judgement fields (honest read, traps, tones, arc, ending, spoiler ending, bandwidth, flags, family, good for/skip if, vibe, series extras, a truth claim) against a JSON schema that only allows the vocabularies. Facts (title, year, runtime, seasons, languages, rating, `watch_in`) come straight from TMDB, never from the model.
4. `validate.js` enforces every CARD_SCHEMA rule: 3–5 vocabulary tones summing to 100 (repairs rounding), vocab-only enums, Wikidata wins on truth (and confidence drops a level), spoiler words kept out of `actually_is`/`vibe` (re-ask once, else reject), no 12+-word runs copied from any source text (re-ask once, else reject), `watch_in` from TMDB India only. Confidence comes from sources read and how many reaction sources there were. A card that fails twice is logged and skipped.
5. `embed.js` embeds `vibe` + tone words + arc words + good_for into `data/embeddings.json`.

**Matching** (`api/recommend.js`): parse with Flash-Lite into the `understood` object plus hard constraints (format, max runtime, languages, platforms, hard no's, family) → if `stay_or_shift` is truly unclear and matters, return the one follow-up → filter the store on hard constraints → embed the mood → cosine top 30 → Flash reranks to 3, with the rating as a quality floor (below 6.0 only if nothing else fits), and writes "why this fits" from the user's own words → `{ followup, picks, understood }`. Saved preferences (S6) arrive in the request body.

### 3.7 States: all verified live (2026-10-02)
`npm run states` passes all 15 checks at 390 light and 1280 dark: empty (0 background requests), first-run preferences → loading → results (prefs saved), one-word input, the follow-up then results, no match → "Try without “in Korean”" → next suggestion, error and retry, offline, and a burst over the per-visitor limit → "Lots of people are choosing right now" → recovers after a minute.

**Found and fixed by making it happen:**
1. "We want to laugh loudly" returned only **two** picks: the parser set a weight ceiling of 1 (2 cards in the store). Weight is now a soft ceiling, set only when someone asks for something light, and dropped if it would leave fewer than three.
2. With the quota out, searches **hung for minutes** (the embedding retried for 61 seconds, five times). Live searches now fail fast, and if embeddings are out too they rank by tone words and rating, still only from the store.
3. Parsing took 3–9 seconds. `minimal` thinking brings it to about 2 (a search is now about 5–7 seconds end to end).
4. The rate-limit test couldn't trip through the UI, because the button waits on each search, so a person can't exceed the limit by tapping. The test now sends a burst that's rejected before any model call (no quota spent).

**Design review of the new screens against the approved card and the direction:** Preferences reuses S1's headline, chips and Curtain button. No match, follow-up and error share one quiet block (a 22px line, then actions). Loading is the approved Loading ticket ×3. One mismatch fixed: the follow-up's answer pills were 24px apart; they're now 8px like every other chip row (measured live: 8, 8, 8).

**Credits footer (Launch L7, done early):** TMDB's required notice, plus JustWatch, Wikipedia (CC BY-SA) and Wikidata, in caption size at Ink 70%. **Open for C3:** TMDB's guidelines also ask for their logo. It's a brand mark in their own colours, which the design direction doesn't allow, so it's your call.

### 3.5 Build and run the pipeline (2026-10-01)
- **Bar:** 300 honest cards in the exact schema, in our own words, from real sources.
- **Check:** counts, failures, average confidence; ten cards spot-checked against their sources.

**Counts:** 300/300 cards in `data/cards.json`. Mix: 125 Hindi, 85 regional (Tamil 26, Telugu 19, Malayalam 19, Bengali 9, Kannada 8, Marathi 4), 90 English and international (English 72, Korean 11, Japanese 4, Spanish 3). 69 are series. Confidence: 159 high, 137 medium, 4 limited. Average sources read per card: 9.7. Truth: 269 fiction, 16 inspired by real events, 15 true stories. 0 failures left (7 failed on the first pass, every one fixed; see below). Embedded into `data/embeddings.json` (768 dims).

**Problems found and fixed while running** (each found by making it happen):
1. Both new Flash models were returning 503 "high demand", and then **every Flash model hit the free tier's 20 requests a day**. Side by side on Dangal and Panchayat, Flash-Lite wrote cards of nearly the same quality about 5× faster, so the pipeline now runs on `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite`. A model that returns a daily-quota 429 is skipped for the rest of the run.
2. Seven cards returned an empty answer: Gemini flagged the prompt as `PROHIBITED_CONTENT` (graphic plot text or Reddit snippets on titles like Fan, Maharaja, Super Deluxe and The Handmaiden). The writer now drops audience reactions, then the full plot, and tries again, and confidence counts only the sources actually read.
3. Embedding hit the 100-texts-a-minute cap, so batches are now paced.

**Spot-check (20 cards read against what's known and the cached sources):**
- **Right:** Dangal (true story, gritty not light), Bhaag Milkha Bhaag ("a grueling, trauma-scarred journey… that happens to feature a lot of running"), Manjummel Boys (true story; "the holiday film it looks like" vs survival nightmare), English Vinglish (inspired by the director's mother), Kota Factory (black-and-white noted), Parasite and Breaking Bad (weight 5, adults only), Kaithi, Jallikattu, K.G.F, Train to Busan, Spirited Away, Gullak, DDLJ, Pathaan, Koi... Mil Gaya.
- **Wrong, fixed:** (a) OMG: Oh My God! was "inspired by real events" when it's adapted from a play. The prompt now defines the three truth statuses precisely. (b) Forrest Gump came out "inspired by" because I'd treated any dated main subject (the Vietnam War) as proof. That rule is gone. (c) The Godfather, Django Unchained, Inglourious Basterds and Titanic were forced to "inspired by" by a Wikidata class I'd wrongly listed as biographical (`Q17013749`). Now only verified classes count (biographical film `Q645928`, docudrama `Q622370`), plus a real person as main subject or a fictional source. (d) Jab We Met had an arc that ends going down with an uplifting ending. The validator now rejects arc/ending contradictions (6 found and regenerated, 0 left). (e) Truth notes started lowercase, so the first letter of every sentence field is now capitalised (469 repaired in place, no rewrite).
- **Still imperfect:** a few truth notes write titles in lowercase ("kanji virudh kanji" was fixed on regenerating; there may be others). "VI movies and tv" (a telecom bundle) shows up as a platform on 79 cards, because that's TMDB's India data. Spoiler endings for ongoing series describe the latest season vaguely.

### 3.6 Swap the engine (2026-10-01)
- **Check:** typing a real mood returns real picks from the store, different for different moods.
Done: `src/engine/live.js` calls `/api/recommend` with the same call shape as the mock. The Vite dev middleware serves `api/*` with keys only in the Node process. Measured: "Rough day at work, warm but not dumb" → Queen, Panchayat, Zindagi Na Milegi Dobara (with "why" lines in the user's own terms). "I am sad" → the follow-up, then "Cheer me up" → Jab We Met, Queen, Panchayat. Surprise me → three random well-rated titles. `npm run flow` passes at 390/1280 × light/dark on the live engine, with 9 different titles across three "show me others". Commit `9d79b55` "Live engine on seed catalogue".

### 3.7 States, designed in code (2026-10-01, follow-up check pending)
- **Bar:** each state appears only because of the real situation that causes it; existing tokens only.
- **Check:** make each happen live with Playwright (`npm run states`) and snap it.
Built: **Empty** (Find waits for input; no background requests, checked by counting them: 0). **Preferences S6** (asked before the first search, saved in localStorage, editable from "What I watch on" in the header, with "Skip for now" and "Any language is fine with subtitles"). **Loading** (the three Loading tickets slide up when you tap, then fill in place). **Partial input** (one word works). **The one follow-up** in place of the tickets, with pill answers. **No match** (names the constraint to loosen, with "Try without “…”", which removes it for that search). **Error / busy / offline** in plain words, with "Try again". **Rate limit** (12 requests a minute per visitor, so one tab can't burn the free quota).
Verified so far: empty and first-run preferences → loading → results passed live. The live run found a real bug: "Try without…" re-sent the same search because the client dropped `loosen`. Fixed, and the engine's next-tightest suggestion was checked ("in Korean" → "under 80 minutes" → results). Then the quota ran out, so the follow-up, no-match, error and rate-limit snaps get re-run after the reset. Re-run at 18:47 IST: the models answered briefly, and empty, first-run preferences and partial input passed again, then the quota ran out on the follow-up. Degraded mode answered "I am sad" with Talaash, Joker and Inside Out, which shows exactly why the follow-up matters. Degraded mode (no model) was tested directly: "my 10-year-old" → Harry Potter, Inside Out, Back to the Future; "sad ending mat dena" excludes sad endings.

### 3.8 Eval (rounds 2 and 3)
- Round 2 was stopped by the 30-minute background limit at mood 17 (16/17 pass). Its one miss: Stree in "scary but not gory" had no "scary" tone. Not written to `docs/eval/`, since it never finished.
- Fixes: the card validator now requires "scary" on horror made to frighten (prompt-only before); Stree, GHOUL, Betaal and The Haunting of Hill House regenerated with it. Munjya's rewrite reads as a goofy creature comedy, so it stays without "scary". Eval now saves after each mood and resumes, and the judge uses 30s timeouts (a slow Gemini period had cost 22 minutes on one mood).
- Round 3: 30/30, fit 4.70, none below 3. Passes. Judge split above. Vi Movies and TV removed from where to watch at Preety's call (80 cards; the pipeline drops it too).

### Phase 4 (pulled forward at Preety's ask, while eval round 2 runs): watchlist, compare, service links
- **Bar:** S4 Watchlist and S5 Compare in "The Single Screen", plus card buttons that do what they say.
- **Reference:** docs/design/approved/ (the card and S2), docs/DESIGN_DIRECTION.md, PRD S4/S5/F6.
- **Limits:** existing tokens only (chosen state = the chosen-chip fill); localStorage, guarded; no page-level sideways scroll at 390px; empty, one-item and full states.
- **Check:** `node scripts/lists.js` (Playwright, seeded with real cards, no Gemini calls) plus snaps at 390/1280, light/dark.
- Built: `src/lists.js`, `src/screens/Watchlist.jsx` (/watchlist), `src/screens/Compare.jsx` (/compare, up to 3, 8 rows), header links with counts, card buttons as toggles ("On your watchlist", "In compare", "Compare is full").
- Preety asked to "connect" Netflix, Prime and others. No service offers account linking or title lookup to outside apps, so: saved services ("What I watch on") come first on each card ("You have it on Prime Video. Also on …") and every name opens that service's search for the title in a new tab (`src/platforms.js`). Netflix, Prime Video, JioHotstar, Apple TV+ and Sun Nxt search URLs loaded when checked; Sony Liv, Zee5 and aha blocked the check, so they and unlisted services open JustWatch India's title search. Replaces the inert `href="#"` links.
- Ran sequentially on branch `phase-4-watchlist-compare`, not the two-worktree exercise the runbook planned: no GitHub repo yet (3.10) and Preety wanted it now. The worktree exercise can still be shown with Phase 5.
- Fix found by the check: hidden screen-reader labels inside the scrolling table pushed the page to 435px; the table box is now `relative`.
- Check: 29/29 pass, no page errors.

### 3.9 C2 approved; 3.10 merge and push
- Preety approved C2.
- Merged `phase-4-watchlist-compare` (which carries `phase-3-live-engine`) into `main` with a merge commit; branch history kept.
- Secret scan before pushing, across every commit: the only env-like file ever committed is `.env.example`; no Gemini, Tavily, GitHub, JWT, private-key or 32-hex "key=" strings anywhere.
- `gh repo create filmfocus --private`, pushed `main` and both branches: https://github.com/preety-rao-designer/filmfocus (private).
- Checked what's on GitHub with a fresh clone: visibility PRIVATE, 65 files on `main`, 17 commits; no `.env`, cache, logs, `node_modules` or `dist`; the same key scan over the clone's full history found nothing.

### Launch prep: Firebase instead of Supabase (Preety's call)
- Seed cards and embeddings stay bundled and searched in memory, as now. Firestore (Spark plan: 1 GiB, 50,000 reads and 20,000 writes a day, no card) holds on-demand cards (L4) and "did this match?" votes (L5). Loading the whole store from Firestore on each cold start would spend about 1,000 reads per start, so it isn't used for that.
- Server-only access via `firebase-admin` with a service account in `FIREBASE_SERVICE_ACCOUNT` (base64 JSON). Updated CLAUDE.md, PRD, RUNBOOK (L1, L2, L5), START_HERE, `.env.example`, `api/_lib/store.js` comment. `.gitignore` now also blocks Firebase key files in case one is saved into the folder.

### L1 Accounts
- Vercel: `vercel whoami` → `preetyrao435-8943`.
- Firebase: project `filmfocus-8ffc5`, Firestore in asia-south1, production mode. Key added by Preety as `FIREBASE_SERVICE_ACCOUNT` (base64), never printed. Verified by a real round trip with `firebase-admin`: wrote, read back and deleted `_healthcheck/setup`.

## Decisions made on my own
- **Tailwind 3 with a `tailwind.config.js`** (not v4's CSS `@theme`), because the runbook asks for tokens "in the Tailwind config". Default palette, spacing, radii and shadows are replaced, so nothing off-direction can be used by accident.
- **Honest read above the title**, following the direction's top-to-bottom anatomy literally (counterfoil → honest read → title). You might prefer the title first, so it anchors the card.
- **Shades of Ink** (Ink at 10–70% opacity) are used for the tone bar segments (the direction asks for this), and also for the Loading placeholders and the pill borders. No new hues.
- **Notches** are page-colored circles rather than true cut-outs, so the one ticket shadow can stay a real `box-shadow`, exactly as specified.
- **Truth line** ("True story." / "Fiction." plus a note) under the honest read. It isn't in the direction's anatomy, but the PRD lists truth status on the card and it's core to the "biopics that are fiction" promise.
- **Left off the card for now:** expectation traps, good for / skip if, content flags, family watchability. They're in the data and PRD table, but not in the direction's anatomy. They feed matching and can go on the card later if you want them.
- **Arc label** "How it feels: up, down, up again" uses the schema's plain shape names.
- **Ratings in the mocks are from IMDb** (source `imdb`). I couldn't read TMDB scores without a key. Scam 1992's vote count and Court's rating are null, because I couldn't confirm them.
- **3 Idiots and Court show "Not streaming in India right now"**. JustWatch India lists no streaming for either today.
- **Scam 1992 episode length is 50 min**, the middle of the 45–60 min range Wikipedia gives.
- **Italic for "Why this fits"** is the browser's slanted Mukta. Mukta has no true italic, and adding one would mean a new font.
- **The limited-confidence card is shown fourth**, on rose, because it's a note on a card rather than a variant.

- **Nine more mock cards** (Zindagi Na Milegi Dobara, Queen, Andhadhun, 96, Kumbalangi Nights, Paddington 2, Inside Out, Chernobyl, Fleabag) in `src/mocks/catalogue.js`, with facts and India streaming from the TMDB API and TMDB ratings. The Phase 1 cards keep their IMDb ratings (not touched). Mix: 5 Hindi, 3 regional, 4 English; 3 series.
- **Header band** on both screens: a Curtain band with "FilmFocus" in Mukta 700 (UI text, so not Rozha One). The palette names a Curtain header band, and the Motion section needs its slot line.
- **"Find my three" waits for input** (disabled until something is typed or a chip is chosen). Proper empty-state handling is 3.7.
- **"Surprise me" works now:** it clears the input and returns any three, in a fresh order each time. Using saved preferences comes later.
- **"How long" has three answers** (One movie, A few episodes, Something to binge). The PRD's "short film" is left out, since there are no shorts in the store.
- **Chosen chips are filled Ink** (Screen in dark mode), not Curtain. Curtain stays the one primary action.
- **Text box** is square-cornered with a 1px Ink-40% border. The direction says nothing else is rounded besides tickets and pills.
- **Focus outline is Screen in dark mode and in the header**, because the Curtain outline vanishes on Curtain/Curtain deep. Inside tickets it stays Curtain.
- **Enter submits; Shift+Enter is a new line** in the mood box.
- **S2 uses an sr-only heading** "Your three picks". The direction gives Results no visible heading.

- **Flash-Lite for cards and the live engine** (not Flash), forced by the free tier's 20-a-day Flash limit. Flash is kept only as the eval judge.
- **Languages on a card = the original language only** (TMDB `original_language`), so "Hindi or English" filters mean what people expect.
- **Platform names from TMDB India**, with "with Ads" and "… Channel" variants dropped, and "Amazon Prime Video" shown as "Prime Video".
- **Wikidata overrides truth only on firm statements** (a real person as main subject, biographical film/docudrama, or adapted from a novel/film/play/comic). A war or disaster as main subject doesn't decide it.
- **The engine response gained `no_match`** (documented in docs/CARD_SCHEMA.md) so the screen can say which constraint to loosen.
- **"Any language is fine with subtitles"** turns the saved-language filter off.
- **Raw source text is git-ignored** (`data/cache/`), since it's third-party text. Cards, seed and embeddings are committed.

- **PMF success targets added to docs/PRD.md** at Preety's request (2026-10-02): opened or saved 50%+, "Did this match?" yes 70%+, 7-day return 20%+, "show me others" use under 40%. Starting points, to revisit at C3.

## Cut or deferred
<!-- Anything cut under the time-box rule, and why. -->
