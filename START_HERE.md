# FilmFocus autopilot kit — start here

This folder is the FilmFocus project before any code exists. Claude Code builds the product inside it by following `docs/RUNBOOK.md`: Phase 1 (the film card), Phase 2 (the happy flow), Phase 3 (the real engine) and Launch (live on the web). It stops only at the checkpoints the runbook lists.

## What's inside

| File | What it is |
|---|---|
| `CLAUDE.md` | Standing rules Claude Code reads every session |
| `docs/PRD.md` | The FilmFocus PRD |
| `docs/DESIGN_DIRECTION.md` | "The Single Screen": the visual direction, researched from web references |
| `docs/CARD_SCHEMA.md` | The film card's exact data shape and vocabularies |
| `docs/EVAL_MOODS.md` | 30 test moods the engine must pass before launch |
| `docs/RUNBOOK.md` | Every phase, step, acceptance check and checkpoint |
| `.claude/skills/prompt-enhancer/` | The course's Prompt Enhancer skill, adapted for autopilot |
| `.claude/settings.json` | Pre-approved safe commands, and `.env` blocked from being read |
| `PROGRESS.template.md` | Becomes `PROGRESS.md`, the running log you can show in your course |

## One-time setup (about 20 minutes)

Do these before starting so the run doesn't pause for them.

1. **Claude Code:** if it isn't installed yet, follow Path B in the course's Git & GitHub push guide (Node, then `npm install -g @anthropic-ai/claude-code`).
2. **GitHub CLI signed in:** run the course push guide's setup prompt, or `gh auth login` yourself.
3. **Keys:** copy `.env.example` to `.env` and fill in:
   - `GEMINI_API_KEY` from https://aistudio.google.com/apikey
   - `TMDB_API_KEY`: create a free account at themoviedb.org, then request an API key in your account settings (choose personal / non-commercial use)
   - `TAVILY_API_KEY`: free account at tavily.com
   - Reddit keys are optional; skip them for now.
   - Firebase keys are only needed at Launch; the run will ask when it gets there.
4. **Vercel:** only needed at Launch. A free account at vercel.com; the run will ask you to sign in with `vercel login` when it gets there.

## Start the run

Open a terminal in this folder, run `claude`, and paste:

> Read CLAUDE.md, then run docs/RUNBOOK.md from Phase 0 on autopilot. Only stop at the checkpoints it lists.

Tip: press Shift+Tab once to switch Claude Code to auto-accept edits, so it doesn't ask before every file change.

## When it stops

It stops for exactly these reasons: missing setup (C0), your design sign-off after the card is built (C1), your review of engine quality (C2), before going public (C3), if it's stuck (C4), or if anything would cost money (C5). The reason and what it needs are always at the top of `PROGRESS.md`.

## If the session ends midway

Claude Code sessions can end (usage limits, closing the laptop). Nothing is lost. Open `claude` in the same folder and paste:

> Read CLAUDE.md and PROGRESS.md, then resume docs/RUNBOOK.md from where it stopped.

## For your course

`PROGRESS.md` records each step's brief (Bar, Reference, Limits, Check), what was built, how it was verified, the decisions made, and the commit for each milestone. Together with the git history, that's the course process, phase by phase.
