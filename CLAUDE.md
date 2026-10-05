# FilmFocus — standing instructions for Claude Code

FilmFocus: a mood-to-movie web app for India. People describe how they feel in plain language and get three movies or shows, each with an honest card showing what it looks like versus what it actually is, its tone, its emotional arc and how it ends (spoiler-free). Goal right now: a live product to test product-market fit. Monetization is out of scope.

## Read these first, every session
1. `PROGRESS.md` — where we are, what's waiting, decisions made so far. Resume from the first unfinished step.
2. `docs/RUNBOOK.md` — the steps, checkpoints and loop you follow.
3. `docs/PRD.md` — what we're building and why.
4. `docs/DESIGN_DIRECTION.md` — the visual bar ("The Late Show", V2).
5. `docs/CARD_SCHEMA.md` — the one data shape everything shares.

## How you work
- Autopilot: run the runbook without asking Preety anything except at the checkpoints it lists (C0–C5). Decide, note the decision in `PROGRESS.md`, keep going.
- Every step uses the course's prompt framework: Task, Do's, Don'ts, Reference, Acceptance check. The acceptance check is how you know you're done, not your own sense of "looks done".
- Make things happen to verify them (Playwright, real requests), don't reason that they'd work.
- One screen or component at a time. Don't tidy, rename or reformat anything you didn't come to change.
- Commit at the points the runbook names, with clear messages. Never push anything containing a secret.

## Stack
Vite + React + Tailwind CSS, JavaScript (not TypeScript). Server-side functions in `api/` (Vercel style). Gemini for understanding, card writing and embeddings. TMDB, Wikidata, Wikipedia, Tavily (and Reddit if keys exist) for sources. Firebase (Firestore) and Vercel at Launch.

## Hard rules
- Secrets only in `.env`, git-ignored. Never `VITE_`-prefix a secret. Never print a key. Never read `.env` contents into your context; test keys by making a request.
- Picks come only from the card store, never from model memory.
- Card written fields are the model's own words, never copied review text. Spoilers only in `spoiler_ending`.
- Design: only the tokens in `docs/DESIGN_DIRECTION.md`. No new colors, fonts, shadows, radii, gradients, stock icons or animation moments.
- Never spend money or enter a card. That's checkpoint C5.
- Stay inside this project folder.
