# FilmFocus progress

**Live URL:** (not yet)
**Current phase / step:** Phase 3, step 3.1

## Waiting for Preety
Nothing right now. C1 approved on 2026-10-01 ("approved for now"). Keys checked 2026-10-01 with real requests: Gemini, TMDB and Tavily each return HTTP 200; Reddit and Supabase are empty, which is fine until Launch.

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

## Cut or deferred
<!-- Anything cut under the time-box rule, and why. -->
