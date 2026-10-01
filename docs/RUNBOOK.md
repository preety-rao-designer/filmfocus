# FilmFocus autopilot runbook

Claude Code follows this file from top to bottom. It is the course's phase scripts (NameGenius LS1–LS3), translated to FilmFocus, with Figma and Mobbin replaced by in-code design, plus a Launch step the course doesn't have.

**Scope of the autopilot run:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Launch. Phases 4–6 are run later, together with Preety.

## How every step runs (the loop)

For each numbered step:

1. **Brief.** Write the step's brief in four lines (Bar, Reference, Limits, Check) at the top of the step's entry in `PROGRESS.md`, using the prompt-enhancer skill. In autopilot, don't wait for approval on the brief, except at checkpoints.
2. **Plan** in plan mode when the step says so.
3. **Build** only what the step asks. Don't tidy, rename or reformat anything the step didn't come to change.
4. **Verify** against the step's acceptance check by making it happen, not by reasoning about it. For anything visual: run `npm run snap`, open the screenshots, compare to the bar, list every difference with measured values, fix only those, snap again. Repeat until the list is empty. Distrust a first pass that comes back clean: re-check one specific detail before believing it.
5. **Commit** when the step says so, with a clear message.
6. **Log** in `PROGRESS.md`: what was done, decisions made on your own (and why), anything skipped, anything Preety might decide differently.

**Deciding on your own:** when a choice isn't covered here, in `docs/PRD.md`, `docs/DESIGN_DIRECTION.md` or `docs/CARD_SCHEMA.md`, make the call that best serves the PRD, write it under "Decisions" in `PROGRESS.md`, and keep going. Don't ask.

**Time-box and revert rule (from the course, Phase 5):** if a step still fails its acceptance check after two fix attempts using the same approach, stop fixing. Revert the step's changes (`git restore` / `git checkout` back to the last commit), cut the step smaller, write down what was cut, and try once more. If that also fails, it becomes a checkpoint.

## Checkpoints: the only times you stop for Preety

Stop, write a short summary at the top of `PROGRESS.md` under "Waiting for Preety", tell her exactly what you need in plain words, and wait.

- **C0 — Missing setup.** A key in `.env` is missing or rejected, a CLI isn't logged in, or a tool can't be installed. Say exactly which one and how to get it.
- **C1 — Design sign-off (end of Phase 1).** Show the card screenshots (all variants, mobile and desktop) and a five-line summary of the design direction. Everything after this is measured against what she approves.
- **C2 — Engine quality (end of Phase 3).** Show the eval summary: pass rate, average fit, the three best and the three worst moods with their picks.
- **C3 — Going public (Launch).** Before the first public deploy, show the live preview URL and confirm she's happy for strangers to use it.
- **C4 — Stuck.** The time-box rule ran out twice on the same step.
- **C5 — Money.** Anything that would cost money or ask for a card. Never proceed.

Never stop to ask about anything else.

## Standing constraints (from `CLAUDE.md`, repeated because they matter)

- Secrets live only in `.env`, which is git-ignored from before it exists. Never prefix a secret with `VITE_`: anything `VITE_` ships to the browser. All calls needing a key go through the server-side `api/` functions.
- Match `docs/DESIGN_DIRECTION.md`. No new colors, fonts, shadows, radii or animation moments.
- The card shape is `docs/CARD_SCHEMA.md`. Nothing invents a field.
- Nothing is recommended from model memory. Picks come only from the card store.

---

## Phase 0 — Setup check

1. Check Node (18+), git, and the GitHub CLI (`gh auth status`). Missing or logged out → C0.
2. Check `.env` exists and holds `GEMINI_API_KEY`, `TMDB_API_KEY` (or `TMDB_READ_TOKEN`) and `TAVILY_API_KEY`. `REDDIT_*` keys are optional. Test each with one tiny request. Don't print any key. Missing or rejected → C0. (Phases 1–2 don't need keys, so if only keys are missing, note it, carry on through Phase 2, and raise C0 at the start of Phase 3.)
3. Create `PROGRESS.md` from `PROGRESS.template.md` if it doesn't exist.

## Phase 1 — One component, designed with taste (course LS1)

The course designs the card in Figma from a Mobbin reference. Here the reference board is `docs/DESIGN_DIRECTION.md` and the card is designed directly in code.

**1.1 Read and restate.** Read `docs/PRD.md` and `docs/DESIGN_DIRECTION.md`. We work on S3, the film card, and nothing else. S1, S2, S4, S5 and S6 don't exist yet, not even as stubs. Write in `PROGRESS.md`, in your own words: the type scale, spacing rhythm, how hierarchy is built on the card, and how state is signalled.

**1.2 Scaffold.** A minimal Vite + React + Tailwind project in this folder, JavaScript not TypeScript. No router, no state library, no extra pages. Load Rozha One and Mukta from Google Fonts with the fallback stacks in the design direction. Put the palette, type scale, radii and the one shadow into the Tailwind config as named tokens (curtain, screen, ink, rose, mint, marigold, brass) so every later screen uses the same names. Add `npm run snap`: a Playwright script that screenshots `/` at 390px and 1280px wide, light and dark, into `docs/design/snaps/`.

**1.3 Mock cards.** In `src/mocks/cards.js`, write three complete mock cards in the exact `docs/CARD_SCHEMA.md` shape: one movie, one series, one with `confidence.level: "limited"`. Use real, well-known Indian and international titles and make every field honest and accurate; if unsure about a fact, pick a different title.

**1.4 Design the card.** Build `FilmCard` with the full anatomy in `docs/DESIGN_DIRECTION.md`, nothing stubbed: counterfoil, perforation and notches, honest read, title and facts line, the arc line (SVG, one smooth path per arc shape, no axes or dots), tone bar, ending and bandwidth, why this fits, where to watch, footer actions (inert for now), spoiler reveal (collapsed, working), limited-confidence line. One component, props-driven, with three variants: Movie, Series, Loading. Layout identical across variants so nothing jumps when data arrives. Render all three variants on the page at once, on three ticket tints.

**1.5 Self-review against the direction.** Snap. Compare against `docs/DESIGN_DIRECTION.md` and list every mismatch in spacing, type, hierarchy and state treatment, with measured values. Check especially: is the honest read the most prominent content? Does the arc line read as a feeling, not a chart? Any color, shadow, radius or font not in the direction? Fix every item. Snap again. Repeat until the list is empty.

**1.6 Polish pass.** Use the impeccable skill if it's installed; otherwise run this checklist yourself: hierarchy at a glance, spacing rhythm on the 4px scale, type treatment, how the three variants read at a glance, keyboard focus visible, contrast (WCAG AA for all text), reduced motion, and whether it looks intentional or generic. Show the list of changes and why in `PROGRESS.md`, then apply them. Stay inside the direction: no new elements the PRD doesn't call for.

**1.7 → C1.** Stop for design sign-off. After approval, copy the approved snaps to `docs/design/approved/`. They are the bar from here on. If Preety asks for changes, make exactly those, snap, and show again.

## Phase 2 — Design and build the happy flow (course LS2)

**2.1 Carry the language forward.** The approved card is the design language for S1 and S2: same tokens, type, spacing. Don't build a formal design system beyond the named Tailwind tokens.

**2.2 Design S1, Mood input,** per `docs/DESIGN_DIRECTION.md` "Screens": headline, text box, optional chips (Who's watching, How long, Stay or shift), "Find my three", "Surprise me". Show it populated, as if someone has typed and tapped. Acceptance: every element reads as a decision made against the direction, not a default.

**2.3 Design S2, Results:** three FilmCards on rose, mint and marigold, "Show me three others". Reuse FilmCard exactly; don't redesign it. No loading variant on the cards yet, no refine chips, no follow-up question, no watchlist or compare screens. Acceptance: the three tickets and the control read as one layout.

**2.4 Plan the build** (plan mode). How the project becomes a small running app: navigation between S1 and S2, the shared FilmCard, where state lives, and a mock engine in `src/engine/mock.js` that returns the exact engine response shape in `docs/CARD_SCHEMA.md` from a mocked set of 12 cards. Name what works by the end of the phase (navigation, Find my three, Show me three others, spoiler reveal) and what stays inert (watchlist, compare, where-to-watch links). Acceptance: the plan names both screens, the shared component, where state lives, and the build order, before any code.

**2.5 Execute: shell and shared card.** Navigation between S1 and S2 (S2 body can be a placeholder at this point). Acceptance: dev server runs, both screens reachable, nothing dead-ends.

**2.6 First commit.** `git init`, a `.gitignore` that already covers `.env`, `node_modules`, `dist`, `docs/design/snaps/`. First commit: scaffold, card and navigation shell. Local only.

**2.7 Happy flow.** "Find my three" sends the typed text and chips to the mock engine, navigates to S2 and renders three cards; "Show me three others" returns a different three each time until the 12 are cycled. Acceptance: real input produces real, different results on each "show me others".

**2.8 Verify and commit.** Snap S1 and S2, compare against the approved card snaps and the direction, list differences with measured values, fix only those, repeat until clean. Click through the whole flow with Playwright: type, tap chips, find, show others twice. Commit: "Happy flow on mocked engine".

**2.9 One more lap.** Pick the one thing on S1 or S2 that least reads as a deliberate decision against the direction, fix it, make it traceable to the direction in `PROGRESS.md`. Commit.

**2.10 The safety net.** Show the git log in `PROGRESS.md`. Demonstrate the course's revert lesson safely: `git switch --detach <second commit>`, snap S1 to show the earlier state, then `git switch main` to return. Note both snaps in the log. Don't use `git reset --hard`.

## Phase 3 — The real engine, plus deferred states (course LS3)

**3.1 Branch.** Create and switch to `phase-3-live-engine`. Main stays as Phase 2 left it.

**3.2 Keys.** Confirm `.env` is ignored and never committed (`git check-ignore .env`). If keys are missing, this is C0 now. Add `.env.example` with names only.

**3.3 Server side first.** Create `api/` as Vercel-style serverless functions (`api/recommend.js`, later `api/card.js` and `api/feedback.js`) and a small Vite dev middleware that serves `api/*` locally, so keys stay server-side from day one and Launch needs no rewrite. The browser only ever calls `/api/*`.

**3.4 Plan the engine** (plan mode). Cover:
- **Card pipeline** (`scripts/pipeline/`), run with Node, per title: TMDB details, India watch providers and ratings; Wikidata facts (look up by TMDB ID property; "based on", "main subject"); Wikipedia plot and reception sections; audience reactions via Tavily search (and Reddit's official API if keys exist); then Gemini writes the card in the schema, with a strict JSON response; then validate against every rule in `docs/CARD_SCHEMA.md` and reject or repair. Throttle to stay inside free-tier rate limits, cache every raw source response to disk, and make runs resumable.
- **Seed catalogue:** 300 titles for this phase. Default mix: about 40% Hindi, 30% regional (Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi), 30% English and international; about a quarter series. Chosen from TMDB's popular and top-rated lists with India watch providers.
- **Embeddings:** a Gemini embedding model over each card's `vibe` plus tone and arc words, stored in `data/embeddings.json`.
- **Matching** in `api/recommend.js`: parse (fast model → `understood` object), follow-up if `stay_or_shift` or another high-impact slot is truly unclear (at most one question), filter on hard constraints, cosine top ~30, rerank to 3 with ratings as a quality floor, write "why this fits".
- Confirm current Gemini model names from the official docs before coding.
- Acceptance: the plan states in plain terms what changes and what stays the same. The screens don't change except to add the states in 3.7.

**3.5 Build and run the pipeline.** Generate the 300-card seed catalogue into `data/cards.json`. Spot-check ten cards against their sources yourself; fix the prompt where they're wrong and regenerate. Log counts, failures and average confidence.

**3.6 Swap the engine.** The UI now calls `/api/recommend` instead of the mock; the response shape is identical. Acceptance: typing a real mood returns real picks from the store, different for different moods. Commit: "Live engine on seed catalogue".

**3.7 States, designed in code.** Using existing tokens only:
- Empty: nothing typed, nothing requested in the background.
- Loading: the screen shows it's working; cards use the Loading variant until filled.
- Error: plain words and a working retry, never a broken screen.
- Partial input: one line of text is always enough to run.
- The one follow-up question in place of the tickets, with pill answers.
- No match for strict constraints: say which constraint to loosen, with a one-tap way to loosen it.
- Preferences (S6): platforms and languages, asked on first run, saved in localStorage, editable.
Acceptance: each state appears only because of the real situation that causes it. Make each one happen live with Playwright (including rapid repeated requests until a rate limit or a simulated one) and snap it. Commit.

**3.8 Eval.** Build `npm run eval` from `docs/EVAL_MOODS.md`. Run it, write results to `docs/eval/`. Fix the worst misses (prompt, filters, or catalogue gaps; add titles if a mood has nothing good to find) and re-run. Stop improving when the pass bar is met or after three rounds.

**3.9 → C2.** Stop for engine review.

**3.10 Merge and push.** Merge the branch into main locally, keeping the branch history. Create a private GitHub repo `filmfocus` with `gh` and push main. Then check what's actually on GitHub and confirm no key is anywhere in it; show what you found in `PROGRESS.md`.

## Launch — live for real users

**L1 Accounts.** Needs a Vercel login (`vercel whoami`) and a Supabase project URL and service key in `.env`. Missing → C0.

**L2 Card store.** Move cards and embeddings into Supabase (Postgres + pgvector). `api/recommend.js` reads from Supabase; keep `data/cards.json` as the seed and backup.

**L3 Grow the catalogue** to about 1,000 titles with the same mix, then re-run the eval. It must still meet the pass bar.

**L4 On-demand cards.** When someone asks for a title not in the store, `api/card.js` generates it through the pipeline, validates it, saves it, and returns it. Show the Loading variant meanwhile.

**L5 "Did this match?"** A small prompt on a card the user opened earlier (tracked in localStorage), with yes, partly, no. Stored via `api/feedback.js` in Supabase. Cards with three or more "no" votes are flagged for regeneration.

**L6 Analytics.** A free analytics tool (Vercel Web Analytics or PostHog's free tier) tracking the PRD's success metrics: searches, picks opened or saved, match votes, refine and "show me others" use, 7-day returns. No personal data.

**L7 Attribution and footer.** TMDB attribution ("This product uses the TMDB API but is not endorsed or certified by TMDB"), JustWatch for streaming data, Wikipedia and Wikidata credits.

**L8 Preview deploy → C3.** Deploy a Vercel preview with env vars set in Vercel (never in code). Run the full flow on the preview URL with Playwright on a phone-sized viewport. Stop for Preety.

**L9 Production.** After approval, deploy to production. Record the live URL at the top of `PROGRESS.md`. Commit and push.

## After Launch: with Preety

- **Phase 4:** watchlist and compare, built in parallel by two agents in two git worktrees, two clean PRs (course LS4 script, applied to FilmFocus).
- **Phase 5:** the adaptive sharpening question, scoped down live, built in one unattended run (course LS5 script). Alternates: refine chips, taste learning from match votes.
- **Phase 6:** the case study.
