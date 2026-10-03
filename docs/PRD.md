# FilmFocus — Product Requirements (Draft)

> Status: draft for review. Written in the same shape as the course's NameGenius PRD, so every phase prompt that reads "the PRD" works the same way. Once approved, this is the file Claude Code reads at the start of every phase.

---

## What FilmFocus is

FilmFocus helps someone find the right movie or show for how they feel right now, and tells them honestly what they're about to watch before they press play.

Two things make it different. First, people describe their mood in plain language instead of scrolling carousels. Second, every recommendation comes with an honest read of the title: what it *looks like* from its name, poster and trailer, versus what it *actually is*. Most discovery platforms rely on broad genre tags and marketing, so people start "light comedies" that turn out to be slow tragedies, or "biopics" that are entirely fictional. FilmFocus exists to stop that.

**Target user:** people in India who watch often but hate choosing. Casual-but-frequent viewers across Hindi, English and regional languages, who are the most burned by misleading titles and trailers. Not primarily cinephiles, who already have strong opinions and their own tools.

**Current goal:** test product-market fit with real users. Monetization is deliberately out of scope for now.

## The jobs it does

1. "Here's how I feel. Give me something that fits, without making me scroll."
2. "Before I commit two hours (or a whole season), tell me what this really is and how I'll feel at the end."

The engine always leans on honesty over hype. A highly rated title that clashes with the user's mood is a wrong answer.

## Inputs

A user can start with a single line of text. Everything else is optional and helps sharpen results.

| Input | Role | Notes |
|---|---|---|
| Mood (free text) | The core signal | Plain language, e.g. "rough day, want something warm but not dumb." |
| Stay or shift | What the watch should do | Comfort me, cheer me up, let me feel it, distract me, thrill me. The most important follow-up, because "I'm sad" can mean opposite things. |
| Who's watching | Company | Alone, partner, friends, family, kids. |
| Time and commitment | Format | Short film, full movie, a few episodes, something to binge. This decides movie versus series without asking directly. |
| Attention level | Bandwidth | Full focus, or something to half-watch. |
| Hard no's | Constraints | No gore, no sad endings, no horror, and so on. |
| Anchor title (optional) | Taste signal | "Something like a title I loved recently." |

### Saved preferences

Asked once, remembered in the browser, no account needed:

- Streaming platforms the user has (India region).
- Languages they're comfortable with, and whether subtitles are fine.

### The one follow-up

The AI reads the free text and fills in whatever it can infer. If an important gap remains (most often stay-or-shift), it asks **one** follow-up as a short question with tappable answers. Never more than one, and never a chat thread. If nothing important is missing, it goes straight to results.

## The core loop

1. User describes their mood (and optionally taps chips).
2. If needed, one follow-up question.
3. FilmFocus returns 3 picks, each with its card.
4. User can refine with one tap (lighter, shorter, in Tamil, not this one) or ask for others.
5. After 3 straight "show me others" with nothing saved, one sharpening question surfaces to improve the next batch.
6. After watching, the user can answer "did this match?", which feeds back into the engine.

## Results

Three picks, not more. The product's promise is to end the scroll, so a short list is a feature. Each pick is a film or show card with a one-line "why this fits how you feel."

### The film card (the heart of the product)

Two kinds of fields: **structured fields** use a fixed vocabulary so the engine can filter and match reliably; **written fields** are for people reading the card and for the embedding that powers mood search.

| Field | Content | Source |
|---|---|---|
| Facts | Title, year, type (movie/series), runtime or seasons and episode length, languages, poster | TMDB, Wikidata |
| Rating | Audience rating and vote count; later, FilmFocus's own "matched expectations" score | TMDB, IMDb non-commercial datasets |
| Where to watch | Streaming platforms in India | TMDB watch providers (JustWatch data, attribution required) |
| Truth status | True story / inspired by real events / fictional, plus a note when the title misleads | Wikidata "based on", cross-checked |
| The honest read | One line on what it looks like, one line on what it actually is | AI synthesis |
| Expectation traps | Specific misreads people report | AI synthesis of audience reactions |
| Tone mix | 3–5 tones from the fixed vocabulary, percentages adding to 100 | AI synthesis |
| Emotional arc and ending | Arc shape (one of six story shapes), feel at start, middle, end; ending payoff (uplifting, bittersweet, devastating, open, cathartic), spoiler-free | AI synthesis |
| Bandwidth | Pace, attention needed, emotional weight 1–5, content flags | AI synthesis |
| Family watchability | Whether it works with parents or kids | AI synthesis + content flags |
| Good for / skip if | Situations and moods it suits, and when to avoid it | AI synthesis |
| Series extras | Ended or ongoing, binge-driven or episodic, "does it get good after episode X", whether later seasons feel different | AI synthesis |
| Vibe description | Short paragraph capturing the feel, used for the embedding | AI synthesis |
| Confidence | Sources read, whether they agreed, confidence level, date generated, refresh due | Pipeline |
| Feedback | Match / no-match votes | Users |

**Spoiler rule:** the default card says only how an ending *feels*, never what happens. Full detail sits behind a tap-to-reveal.

**Tone vocabulary (draft, to finalize in Phase 3):** warm, funny, romantic, hopeful, uplifting, nostalgic, whimsical, thrilling, tense, scary, dark, melancholy, heartbreaking, thought-provoking, chaotic.

### Ratings guardrail

Ratings measure quality, not fit. They act as a quality floor in ranking and are displayed on the card, but never drive the order of results.

## How cards get made

Cards are written by AI, never by hand, and generated **once per title**, then stored and reused. This keeps costs near-fixed, makes results load instantly, and lets the system judge and improve accuracy over time.

1. **Gather facts:** TMDB, Wikidata, Wikipedia (plot and "Reception" sections).
2. **Gather reactions:** public reviews, discussions and news found via a search API or a model with web search; Reddit via its official free API tier. Audience reactions are the best signal for expectation versus reality.
3. **Synthesize:** the AI writes the card in its own words, in the exact shape above. Never copied review text.
4. **Score confidence:** agreement across sources = high confidence; conflict or thin coverage = lower confidence, stated on the card ("based on limited reactions").
5. **Refresh:** new releases get a first card around release week and a refresh after 2–3 weeks, when early hype has settled.
6. **On-demand:** a seed catalogue covers popular titles; any title not yet in it gets a card generated when first requested, then saved for everyone.
7. **Self-correct:** "did this match?" votes flag wrong cards, so review time goes only to flagged ones.

## How matching works

A hybrid: AI does the understanding, FilmFocus's own card store does the knowing. The AI never recommends from memory alone.

1. **Parse:** a fast, cheap model turns the user's words and chips into hard constraints (runtime, language, platform, hard no's, family-safe) and a soft mood description.
2. **Filter:** apply the hard constraints to the card store.
3. **Retrieve:** vector search over vibe descriptions for the top ~30 candidates.
4. **Rerank:** the model picks the best 3 and writes the "why this fits" line, with ratings as a quality floor.
5. **Learn:** refine taps and "did this match?" votes adjust future ranking.

### Engine quality check

A fixed test set of about 30 moods, including hard ones ("need to cry but in a good way," "something my parents and I can both watch," "mindless but not stupid"). The top 3 for each is judged before launch and re-run after every prompt or catalogue change.

## Feature backlog

Listed roughly by build size.

1. Show me others (small)
2. Saved preferences: platforms and languages (small)
3. Refine chips: lighter, shorter, in a language, not this one (small)
4. Spoiler tap-to-reveal (small)
5. Watchlist, stored locally (small)
6. "Did this match?" check-in (medium)
7. Compare two picks side by side (medium)
8. Surprise me, from saved preferences only (medium)
9. The adaptive sharpening question after 3 "show me others" (larger)
10. Taste learning from feedback, e.g. "you rarely finish slow-burn titles" (larger)
11. Group mode: two or three moods, one pick (larger, post-PMF)

## Constraints and out of scope

- No monetization, ads or subscriptions during the PMF test.
- No accounts at first. Preferences and watchlist live in the browser via localStorage.
- Open and free data sources only, used within their free, non-commercial terms. Official APIs over scraping, because scrapers break when sites change.
- Commercial licensing (TMDB commercial terms, Reddit data agreements, streaming availability partnerships) is deferred until after PMF.
- Unlike the course track, FilmFocus does need hosting and a card store, because it launches to real users. That is added as a dedicated step after Phase 3 (see "Launch").

## Technical direction

**Stack (as taught in the course):** Vite + React + Tailwind CSS, JavaScript. Claude Code is the harness.

**Generation and understanding:** Google Gemini, Flash-tier model, free tier, own key from https://aistudio.google.com/apikey. Used for mood parsing, reranking and card synthesis. Confirm the current Flash model name at build time.

**Film data:** TMDB API (free, non-commercial, attribution required), including India-region watch providers. Wikidata (CC0) and Wikipedia (CC BY-SA, with attribution) for facts and reception. IMDb non-commercial datasets for ratings if TMDB's are not enough.

**Audience reactions:** a search API with a free tier (e.g. Brave, Tavily or Exa) and Reddit's official free API tier.

**Embeddings:** an open-source embedding model or a free-tier embedding API.

**Launch additions:** Vercel for hosting (serverless functions keep API keys off the browser), Supabase free tier for the card store (Postgres + pgvector) and feedback votes, and a free analytics tool for PMF metrics.

## Design direction

Set in docs/DESIGN_DIRECTION.md ("The Single Screen"), researched from web references. No Figma and no Mobbin: Claude designs directly in code, using the same Describe, Review, Iterate loop the course teaches. The film card built in Phase 1, once Preety approves it at Checkpoint 1, becomes the bar for every later screen.

Fixed principles regardless of visual style: calm and low-effort to use (the product respects the user's bandwidth), honest over hyped, three picks not a wall of posters, and the card's honest read is always the most prominent thing on it.

## Screen architecture

### Screens

| ID | Screen | Contents |
|---|---|---|
| S1 | Mood input | Free-text box, optional chips (who's watching, time, stay-or-shift), "Find something" action, "Surprise me" option. |
| S2 | Results | 3 picks with cards, a "why this fits" line on each, refine chips, "show me others", and the area where the one follow-up or sharpening question appears. |
| S3 | Film card (component) | Everything in the card table above. Actions: add to watchlist, add to compare, reveal spoilers, where to watch. |
| S4 | Watchlist | Saved titles, remove, see card. localStorage. |
| S5 | Compare | Two or more picks side by side across tone, ending feel, bandwidth, runtime and platform. |
| S6 | Preferences | Platforms and languages, set once and editable. |

### Flows

| ID | Flow | Path |
|---|---|---|
| F1 | Quick mood | Type one line, get 3 picks. |
| F2 | Guided | Tap chips (with or without text), get 3 picks. |
| F3 | One follow-up | Input has an important gap, one tappable question, then results. |
| F4 | Show me others | Not satisfied, get 3 more; after 3 straight with nothing saved, a sharpening question appears. |
| F5 | Refine | Tap a refine chip, results update. |
| F6 | Watchlist | Save a title, view the watchlist. |
| F7 | Compare | Add two or more titles, view side by side. |
| F8 | Match check | After watching, answer "did this match?" |
| F9 | First run | Set platforms and languages once. |

### Cases and states to handle

Empty (nothing typed yet). Loading (understanding the mood, finding picks, generating a card on demand). Error (API failure or rate limit). High versus limited confidence per card. Movie versus series card. Partial input (only one line of text). A title with no Indian streaming availability. No match for very strict constraints. Three straight "show me others" with nothing saved (triggers a question). localStorage empty versus populated (watchlist, preferences).

## Success metrics for the PMF test

Targets are set before launch so results can't be read generously afterwards. Starting points, to revisit at Checkpoint C3:

| Metric | Target | Why it matters | Tracked from |
|---|---|---|---|
| Share of searches where the user opens or saves at least one pick | 50% or more | The three picks were worth a look | Launch L6 (opens); Phase 4 adds saves via the watchlist |
| "Did this match?" yes rate | 70% or more ("partly" reported separately) | The honest read held up after watching: the core promise | Launch L5 |
| Returning users within 7 days | 20% or more | People come back the next time they need something to watch | Launch L6 |
| Share of sessions using refine or "show me others" | Under 40% (lower is better) | A signal the first three missed | Launch L6 |

Before launch, the engine eval (docs/EVAL_MOODS.md) stands in for these. Its bar is rule checks passing on 28 of 30 moods, with an average fit of 4.0 or more and no mood below 3.

---

## The phases

Same arc as the course, adapted to FilmFocus. Tools that don't fit (Figma, Mobbin) are replaced with reference screenshots and in-code design.

| Phase | FilmFocus reaches | Skill practised |
|---|---|---|
| 1 | One component designed with taste: the film card, built directly in code against Preety's references | Directing AI with a real reference; the Describe, Review, Iterate loop |
| 2 | Mood input and Results as a running app on mocked cards, happy path only | Five-part prompt framework, plan versus execution mode, designing with a system, mocking the API contract, first git use |
| 3 | The real engine: card pipeline, seed catalogue, mood parsing and matching, plus empty, loading and error states | Live API integration, keys and secrets, designing states in code, first push to GitHub |
| Launch | Live on the web for real users | Hosting, serverless keys, card store, analytics |
| 4 | Watchlist and compare, built in parallel by two agents in two git worktrees | Parallel agents, clean PRs (see open item) |
| 5 | A larger feature, scoped down and built agentically | Scoping small, the full agentic loop |
| 6 | Packaged as a portfolio case study | Positioning and narrative |

### Feature distribution across the phases

| Feature | Designed | Built (happy path) | Wired (real) |
|---|---|---|---|
| Film card (S3): movie, series and loading variants | Phase 1 | Phase 2 | Phase 3 |
| Mood input (S1) with chips | Phase 2 | Phase 2 | Phase 3 |
| Results (S2), 3 picks, show me others | Phase 2 | Phase 2 (mocked) | Phase 3 |
| Card pipeline and seed catalogue | — (no UI) | — | Phase 3 |
| Mood parsing and matching | — (no UI) | Phase 2 (mocked) | Phase 3 |
| Empty, loading, error states | Phase 3 | Phase 3 | Phase 3 |
| Preferences (S6) | Phase 3 | Phase 3 | Phase 3 |
| Hosting, card store, on-demand cards, analytics | — | — | Launch |
| "Did this match?" check-in | Launch | Launch | Launch |
| Watchlist (S4) | Phase 4 | Phase 4 | Phase 4 |
| Compare (S5) | Phase 4 | Phase 4 | Phase 4 |
| Adaptive sharpening question (F4) | Phase 5 | Phase 5 | Phase 5 (anchor) |
| Refine chips (F5) | Phase 5 | Phase 5 | Phase 5 (alternate) |
| Taste learning from feedback | — | — | Phase 5 (second alternate) |
| Group mode | not planned | post-PMF | post-PMF |

### Phase 1 — One component, designed with taste

**Goal.** Design the film card, the heart of the product, directly in code, measured against Preety's reference screenshots.

**Build requirements.**
- One component only: the film card (S3), full anatomy as in the card table.
- Three variants: Movie, Series, Loading. Layout stable across all three so nothing jumps when data arrives.
- Low confidence shown as a small, honest note on the card, not a separate variant.
- Spoiler tap-to-reveal present but collapsed.
- A minimal Vite + React + Tailwind project, just enough to render the card with mocked data. No other screen exists yet.

**Design requirements.**
- A written design direction derived from Preety's references: type scale, spacing rhythm, how hierarchy is built, how state is signalled. Take structure and rhythm from references, never brand.
- The honest read is the most prominent element on the card.
- A review loop: screenshot the running card, compare to the references, list differences, fix only those, repeat until it matches.

### Phase 2 — Design and build the happy flow

**Goal.** Grow the card into a small system and build Mood input and Results as a real, running app on mocked data.

**Build requirements.**
- Mood input (S1) and Results (S2) share the card's type scale, spacing and palette.
- Typing and tapping chips update real state; "Find something" calls a mock engine and shows 3 mocked cards; "Show me others" swaps in a new set.
- The mock engine returns data in the exact shape the real engine will, so Phase 3 swaps its insides without touching the UI.
- Happy path only: no empty, loading, error or follow-up states yet.
- Watchlist, compare, refine chips, preferences and the sharpening question don't exist yet.
- First git use: initialize, commit three times, revert to the second commit.

### Phase 3 — The real engine, plus the states Phase 2 deferred

**Goal.** Recommendations come from real data for the first time.

**Build sketch.**
- Work on a branch; protect the key before creating it.
- A card pipeline script: facts from TMDB, Wikidata and Wikipedia, reactions via search, card synthesis by Gemini, confidence scoring. Run it to build a seed catalogue.
- Mood parsing, filtering, retrieval and reranking against that catalogue.
- The one follow-up question when input has an important gap.
- Preferences (S6): platforms and languages, saved locally.
- Empty, loading and error states, designed directly in code.
- Run the 30-mood test set and fix the worst misses.
- Merge to main and push to GitHub, confirming no key is in the repo.

### Launch — Live for real users

**Goal.** FilmFocus is on the web and people can use it. Not part of the course track; added because FilmFocus is a real product.

**Build sketch.**
- Move every API call behind Vercel serverless functions so keys never reach the browser.
- Move the card store to Supabase (Postgres + pgvector).
- On-demand card generation for titles not yet in the catalogue.
- The "did this match?" check-in, stored in Supabase.
- Free analytics wired to the success metrics.
- Deploy to Vercel on a real URL.

### Phase 4 — Two features, two agents

**Goal.** Build watchlist and compare at the same time, each by its own agent in its own git worktree, each shipped as its own clean PR.

**Build sketch.** Confirm the two features touch no shared files, set up two worktrees, hand off both, verify each separately (including the rest of the app), open two single-purpose PRs, merge, and confirm the whole app still works. States: watchlist empty versus populated, removing the last title returns to empty; compare with fewer than two versus two or more.

### Phase 5 — A larger feature, scoped down and built agentically

**Goal.** Name the big version of a feature, cut it to a shippable slice live, then hand it to Claude Code in one unattended run.

**Build sketch.**
- Anchor: the adaptive sharpening question. The big version learns which question to ask and when; the slice is "after 3 straight 'show me others' with nothing saved, surface one question, and use the answer in the next batch."
- Alternate: refine chips on Results.
- Second alternate: taste learning from "did this match?" votes (pure logic, no new screen).
- Time-box and revert rule as taught.

### Phase 6 — Packaging and positioning

**Goal.** No new build. Turn FilmFocus into a portfolio case study: the problem, the key decisions, what shipped, PMF results so far, and what comes next.

---

## Decisions on record

1. Launch audience: India-first, Hindi, English and regional languages, Indian streaming platforms.
2. Content: movies and series.
3. Results: 3 picks per search, not 5.
4. Input: a hybrid single screen (free text plus optional chips) with at most one follow-up question; refinement happens on the results screen. Not a chat, not a form.
5. Engine: hybrid. AI parses mood and reranks; FilmFocus's own stored cards are the source of truth. No recommending from model memory alone.
6. Cards: generated by AI once per title from facts plus audience reactions, stored and reused; on-demand for missing titles; refreshed for new releases; confidence scored.
7. Ratings: shown and used as a quality floor, never as the ranking.
8. Goal: product-market fit test. Monetization and commercial licensing deferred.
9. Data: open and free sources within their free terms, official APIs over scraping.
10. Stack: Vite + React + Tailwind CSS, JavaScript, as taught. Gemini Flash-tier for AI. Vercel and Supabase added at Launch.
11. Design: no Figma, no Mobbin. Claude researched references on the web and designs directly in code; direction in docs/DESIGN_DIRECTION.md, approved at Checkpoint 1.
12. Execution: Claude Code runs Phases 1–3 and Launch on autopilot from docs/RUNBOOK.md, stopping only at the checkpoints listed there. Phases 4–6 are run together with Preety afterwards.

## Open items

1. **Phase 4 venue:** do the exercise in the course's practice repo as taught, or apply the same two-agent worktree technique to watchlist and compare in FilmFocus itself. This PRD assumes the latter.
2. **GitHub:** FilmFocus in Preety's own GitHub account, separate from the course team repo, unless the course requires otherwise.
3. **Tone vocabulary:** fixed in docs/CARD_SCHEMA.md; revisit only if the eval shows gaps.
4. **Seed catalogue size and mix:** default in docs/RUNBOOK.md (300 titles for Phase 3, grown to ~1,000 before Launch); change it there.
