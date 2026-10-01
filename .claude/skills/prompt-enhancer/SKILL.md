---
name: prompt-enhancer
description: Use whenever the task is designing a UI, building a component, screen, or flow, or building a feature step from docs/RUNBOOK.md. Forces the step to be defined (Bar, Reference, Limits, Check) before any code is written. Adapted from the course's Prompt Enhancer for FilmFocus autopilot.
---

# Prompt Enhancer (FilmFocus autopilot version)

The course version asks the student for any missing part. In autopilot, you fill the missing parts yourself from the project docs, and only ask Preety at a runbook checkpoint.

## Steps

1. Do not write code yet.
2. Define these four for the current step:
   - **Bar:** one sentence naming the screen or piece and its design language ("The Single Screen", docs/DESIGN_DIRECTION.md).
   - **Reference:** the concrete thing it's measured against. Before Checkpoint 1: docs/DESIGN_DIRECTION.md. After Checkpoint 1: the approved snaps in docs/design/approved/, plus the direction. For data: docs/CARD_SCHEMA.md.
   - **Limits:** three to six hard constraints, covering whichever apply: sections, tokens/spacing/type, states, platform (mobile-first), things to avoid. Take tokens from the direction; never infer new ones from a reference.
   - **Check:** how "done" is verified, e.g. snap and compare to the approved card, or run the eval.
3. Write the four lines at the top of this step's entry in PROGRESS.md. At a checkpoint step, stop for approval; otherwise continue.
4. Build one screen, component or piece only.
5. Review: does it match the reference, is it complete across states and sizes (390px and 1280px, light and dark), does it look intentional? List differences, fix them against the reference, repeat until clean.

Keep the brief short. If a line doesn't change the output, cut it.
