# FilmFocus design direction: "The Single Screen"

Status: proposed by Claude from web research, to be approved by Preety at Checkpoint 1. Once approved, the rendered film card is the bar every later screen is measured against.

## The idea in one sentence

FilmFocus feels like an Indian single-screen cinema on a quiet weeknight: three paper tickets handed across the counter, each one telling you honestly what show you're walking into.

## Why this, and not a generic "dark streaming app"

Every streaming app and most mood-recommender concepts are the same thing: a black screen, a wall of posters, a gradient over the image. FilmFocus's whole point is the opposite of a poster wall. It gives you three picks and tells you the truth about each. A paper ticket is the right object for that: it is small, specific, one per show, and every Indian filmgoer over 25 has held one. It also gives the card a natural two-part structure, the counterfoil and the ticket, which maps exactly onto the product's core idea: what it looks like, versus what it actually is.

## References (take structure and rhythm, never brand)

| Reference | What we take | What we leave |
|---|---|---|
| MUBI (mubi.com) and its identity by Spin | Curation over catalogue: a few picks, type-led, editorial confidence, lots of calm space | Its all-caps Riforma display, cobalt accent, zero-radius severity |
| Letterboxd film pages (letterboxd.com) | How dense facts (year, runtime, rating, where to watch) sit quietly beside the main content without competing | The poster-grid browsing model |
| Kurt Vonnegut's story shapes and Reagan et al. (2016), "The emotional arcs of stories are dominated by six basic shapes" | The arc line: a single hand-drawn curve showing how a title *feels* from start to end, from one of six shapes | Any chart chrome: no axes, gridlines or legends |
| Old Indian single-screen paper tickets and counterfoils | The card object: a perforated counterfoil, paper tints, a stamped feel, one ticket per pick | Literal skeuomorphism: no paper textures, no fake torn edges, no photos of tickets |
| FilmyMood (Gemini-built Indian mood app, Medium write-up) and Cineo (UX case study) | Confirmation that a "why this fits" line per pick and low decision fatigue matter to Indian users | Their preset-mood grids and social-buzz clutter |
| Hacker News "Show HN" threads on mood movie apps | Users' main complaints: absurd picks and too many options. Fewer, better picks win | — |

## Palette

Named colors, used by role. Colors never carry meaning on their own; any state is also written in words.

| Name | Hex | Role |
|---|---|---|
| Curtain | `#5B1224` | Velvet-curtain maroon. The brand color: header band, primary button, the arc line. |
| Curtain deep | `#2B0A14` | Dark-mode page background (a clearly colored maroon, not a near-black). |
| Screen | `#F5F6F8` | Light-mode page background, the cool white of a projection screen. |
| Ink | `#2E1119` | Text on light surfaces and on ticket paper. |
| Rose ticket | `#F2C4CE` | Ticket paper for pick 1. |
| Mint ticket | `#C9E4D0` | Ticket paper for pick 2. |
| Marigold ticket | `#F3D27A` | Ticket paper for pick 3. |
| Brass | `#9C7A2E` | Perforation dots and tiny details only. Never text. |

The three ticket tints are identity, not meaning: pick 1 is always rose, 2 mint, 3 marigold, like different classes of seat. In dark mode, tickets keep their paper tints (they are objects on a dark counter) and the page becomes Curtain deep.

## Type

- **Display: Rozha One** (Google Fonts). High-contrast, poster-like, and it covers Latin and Devanagari, so Hindi titles look native, not like an afterthought. Used for film titles and the one headline on the input screen. Never for UI text.
- **Text and UI: Mukta** (Google Fonts, Latin and Devanagari, weights 400/500/700). Everything else. Tabular figures for runtimes, percentages and ratings.
- **Regional scripts:** fall back to the matching Noto Sans family (Tamil, Telugu, Malayalam, Kannada, Bengali, Gujarati) so regional titles render correctly.
- Fallback stacks: `"Rozha One", "Noto Serif Devanagari", Georgia, serif` and `"Mukta", "Noto Sans", system-ui, sans-serif`.

**Scale (px, mobile / desktop):** 14 caption, 16 body, 18 lead, 22 section, 32 card title / 36, 44 input headline / 56. Line height 1.5 for body, 1.1 for display. Sentence case everywhere. No all-caps labels, no monospace labels, no eyebrow text above headings, no single-word accents in headlines.

## Spacing and shape

- 4px base; the rhythm used is 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: tickets 14px outer corners, with two semicircle notches (10px) where the perforation meets the edges, like a real ticket. Buttons and chips 999px (pill). Nothing else is rounded. This is the only shape language in the app.
- No drop shadows except one: a tickets-on-a-counter shadow `0 1px 0 rgba(46,17,25,.08), 0 8px 24px -12px rgba(46,17,25,.25)`.
- Mobile-first: most users will be on phones. Content max-width 720px on desktop, centred column.

## The film card (the ticket)

Anatomy, top to bottom on mobile (counterfoil on the left on desktop):

1. **Counterfoil, "On the poster":** one line on what the title looks like from its name, poster and trailer. Smaller, lighter weight. Separated from the ticket by a perforation (a row of brass dots) and the two edge notches.
2. **Ticket, "In the hall":** the honest read, what it actually is. This is the largest text on the card after the title, in Mukta 500 at 18px. It must always be the most prominent content element.
3. **Title** in Rozha One, with year, type (Movie / Series with seasons), runtime or episode length, languages, rating and vote count in one quiet line of Mukta 14px.
4. **The arc line:** one continuous hand-drawn-feeling SVG stroke in Curtain, 2.5px, drawn across the full ticket width, following one of the six story shapes, with three tiny words under start, middle and end ("tense", "heavy", "warm"). The memorable thing on the card. Spend boldness here and nowhere else.
5. **Tone mix:** a single segmented bar, each segment labelled in words with its percentage. Segments are shades of Ink on the ticket paper, not rainbow colors.
6. **Ending feel** (e.g. "Ending: bittersweet") and **bandwidth** (pace, attention, emotional weight 1–5) as short text pairs.
7. **Why this fits you:** one line in italic Mukta, written for this user's mood.
8. **Where to watch:** platform names as plain text links.
9. **Footer row:** add to watchlist, add to compare, "Read how it ends" (spoiler reveal, collapsed by default).
10. **Confidence:** when confidence is limited, one small line: "Based on limited reactions." Never a badge, never a color.

Variants: **Movie**, **Series** (adds seasons, episode length, ended or ongoing, "gets good after episode X" when known), and **Loading** (same layout with ticket paper visible and text lines as soft placeholder bars, so nothing jumps when data arrives).

## Screens

- **Mood input:** Screen background, one headline in Rozha One ("What are you in the mood for?"), a large text box, a row of optional pill chips beneath (Who's watching, How long, Stay in this mood or shift it), one Curtain pill button "Find my three". "Surprise me" as a quiet text link. Nothing else on the screen.
- **Results:** three tickets stacked with 24px between them, refine chips above them, "Show me three others" below. The one follow-up question, when needed, appears in place of the tickets as a short line with pill answers.

## Motion

One orchestrated moment only: when results arrive, the three tickets slide up from a thin slot line at the bottom of the header, one after another (80ms apart, 320ms each, ease-out), like tickets pushed through a counter window. It answers the user's action. Nothing else animates on its own. Under `prefers-reduced-motion`, tickets simply appear.

## Voice

Plain, warm, a little dry. Like a friend at the ticket counter who has seen everything. "This one looks like a comedy. It isn't, really." Buttons say exactly what happens. Errors say what went wrong and what to do: "Couldn't reach our film notes. Try again in a moment."

## What would count as a miss

- A poster grid, gradients over images, glowing accents, or a near-black background.
- The honest read looking secondary to the title or poster.
- The arc line looking like a chart (axes, gridlines, dots on the line).
- Paper textures, torn-edge images, or anything that turns the ticket into a costume.
- More than one animation moment.
