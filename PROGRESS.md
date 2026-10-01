# FilmFocus progress

**Live URL:** (not yet)
**Current phase / step:** Phase 1, step 1.7 (Checkpoint C1)

## Waiting for Preety
**C1: design sign-off on the film card.** Please look at the four snaps in `docs/design/snaps/` (`home-390-light.png`, `home-390-dark.png`, `home-1280-light.png`, `home-1280-dark.png`), or run `npm run dev` and open the page. They show Movie (3 Idiots, rose), Series (Scam 1992, mint), Loading (marigold) and a limited-confidence card (Court, rose).

The direction in five lines:
1. Each pick is a paper ticket. The counterfoil ("On the poster", what it looks like) is torn off along a brass perforation with two notches from the ticket ("In the hall", what it actually is).
2. The honest read is the lead content: Mukta 500 at 18px, the first thing in the ticket, ahead of the title.
3. The title is in Rozha One (32/36px), with one quiet 14px facts line. Every other part is supporting text in ink.
4. The arc line is the one bold graphic: a single Curtain stroke, no axes or dots, with three feeling words.
5. State is always words, never color: "Based on limited reactions.", "Not streaming in India right now.", "Read how it ends" (a working toggle). Loading keeps the same layout with soft bars.

Reply "approved", or tell me exactly what to change.

Keys (checked 2026-10-01 with real requests): GEMINI, TMDB and TAVILY each return HTTP 200. Reddit and Supabase are empty, which is fine until Launch.

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

## Cut or deferred
<!-- Anything cut under the time-box rule, and why. -->
