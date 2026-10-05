# FilmFocus design direction: "The Late Show" (V2)

Status: approved by Preety on 2026-10-05 from the mock in `docs/design/v2/mock.html`. It replaces V1, "The Single Screen" (paper tickets), which is in git history. The approved mock and the V2 snaps in `docs/design/snaps/v2-*` are the bar every screen is measured against.

## The idea in one sentence

FilmFocus feels like the late show: the room goes dark, one film fills the screen, and a friend tells you honestly what it really is. Three picks, one in focus at a time.

## Where it comes from (Preety's references)

| Reference | What we take | What we leave |
|---|---|---|
| A Kurosawa VHS shelf site (spines on a shelf, the chosen tape pulled forward, title and year under it) | The shelf: a row of titles you can browse, one pulled forward when chosen | VHS skeuomorphism, distressed textures, decade filters |
| The "Modern Netflix website" concept by Sandhill Studio (tall poster strips that widen on hover, a strip opening into a full-width still) | The home shelf of tall strips that widen and show the title; a title opening into its backdrop | Genre labels on strips, the side menu, the brand |
| A cinema booking page ("01 Kong: Skull Island") | The results layout: a full-bleed backdrop, a big thin numeral next to a bold title, the other picks as posters beside it, arrows to move between them | Star ratings, showtimes, "Book now" |

## Palette

Named colors, used by role. Color never carries meaning on its own; any state is also written in words.

| Name | Value | Role |
|---|---|---|
| Night | `#0D0B0C` | Page background (a warm near-black). |
| Night raised | `#171314` | Raised surfaces: the mood box, image placeholders. |
| Paper | `#F4EFE9` | Text and pressed (on) controls. Tone segments are shades of Paper. |
| Muted | `#A9A19A` | Secondary text: labels, facts, "Looks like", links at rest. |
| Amber | `#F5B841` | The one accent: the primary button, the arc line, the focused poster's ring, "Actually is", counts. Hover `#FFC85C`. |
| Line | Paper at 14% | Hairlines between sections and around outline buttons. |

Images come only from TMDB (posters and backdrops), credited in the footer.

## Type

- **One family: Inter Tight** (Google Fonts) at 200 / 400 / 500 / 700. Bold for titles and the first line of headlines; thin (200) for the numerals 01–03 and the second line of headlines ("What are you / *in the mood for?*").
- **Indian scripts:** Noto Sans Devanagari is loaded; Tamil, Telugu, Malayalam, Kannada, Bengali and Gujarati fall back to their Noto Sans families.
- Tabular figures for runtimes, ratings, percentages and counts.

**Scale (px, phone / desktop):** 12 label, 14 caption, 16 body, 18 lead, 20 / 22 the "Actually is" read, 34 / 54 title, 44 / 80 headline, 72 / 120 numeral. Line height 1.5 for text, 1.4 for the read, about 1.0 for titles and headlines with tight tracking. Sentence case everywhere; no all-caps labels.

## Spacing and shape

- 4px base: 4, 8, 12, 16, 20, 24, 32, 48, 64.
- Page content up to 1240px wide; 16px gutters on phones, 48px on desktop. Reading text is held to about 560–640px.
- Radius: posters 10px, the mood box 20px, buttons and chips pill. Nothing else is rounded.
- No drop shadows. Depth comes from the images and the scrims.

## Screens

- **Home:** headline on the left, the mood box, chips, "Find my watch" (Amber) and "Surprise me" on the right; stacked on phones. Below, the **shelf**: tall poster strips (two Indian titles for every one from elsewhere, a new mix daily) that drift slowly, widen on hover to show the title, and scroll by trackpad, swipe, drag or the ← → buttons. Tapping a poster opens its page.
- **Results:** the focused pick's backdrop fills the screen under a scrim. On it: "For …" with "Change my mood", the numeral and title, the facts line, the honest read, why it fits (with an Amber rule), and the actions. All three posters sit beside it on desktop and above it on phones, so the three are always in view. Tapping another poster (or ← → keys) moves the focus; tapping the focused one opens its page. Under the posters, **Regenerate** (outline pill with a circular-arrow icon) brings three different picks. Below the backdrop: how it feels, tone, the four pairs, where to watch, "Read how it ends" (folded).
- **Loading results:** the title's place says what the engine is doing ("Reading your mood…", "Looking through our honest cards…", "Weighing tone, pace and endings…", "Picking your three…"), the poster slots shuffle heavily blurred shelf posters, placeholders shimmer, and a thin Amber line runs along the top. Under reduced motion: one still line, "Finding your three…".
- **Title search:** a search icon (a plain stroked magnifier in Muted, the one icon in the app) in the header, and the "/" key, open a full-screen Night panel with one big bold field. Matches from our catalogue appear as you type (English names, the original-language name, or the name someone asked for), with a small poster, type and year; Up/Down and Enter, or a tap, open the title's page. When we don't have it: "Make its card".
- **A title's page** (`/title/<id>`): its backdrop, title, facts, honest read, truth note and actions; below, the details plus "Good for", "Skip it if" and "Don't go in".
- **Watchlist, compare, preferences:** Night pages with the bold/thin headline, posters where a title appears, and the same buttons and chips.

## The honest read comes first

The product's core idea stays the most prominent content after the title: "Looks like" (small, Muted) then "Actually is" (Amber label, the largest text after the title). It is never placed after the rating, the actions or the poster rail.

## Controls

- **Primary:** Amber pill, bold Night text. One per view: "Find my watch", "Watch on …", "Try again", "Make its card".
- **Secondary:** outline pill (Line border, Paper text). Pressed (on watchlist, in compare, a chosen chip) is filled Paper with Night text, plus `aria-pressed` and words that say so.
- **Quiet link:** Muted, underlined: "Change my mood", "Surprise me", "See the full page →", "← Back".
- **Round:** 44px outline circles for the shelf's ← → arrows.

## Motion

- The backdrop crossfades (600ms) when the focus moves; the text fades and rises 12px (350ms).
- The focused poster lifts 10px with an Amber ring.
- Shelf strips widen on hover (450ms); the shelf drifts about 20px a second when nobody is touching it.
- Under `prefers-reduced-motion`, nothing drifts or fades; things simply change.

## Voice

Plain, warm, a little dry, unchanged from V1. "This one looks like a comedy. It isn't, really." Buttons say exactly what happens. Errors say what went wrong and what to do.

## What would count as a miss

- A browsing grid of many posters on results (results is always three).
- The honest read looking secondary to the title, the rating or the imagery.
- Text over a bright part of an image without a scrim.
- More than one Amber primary action in a view, or a second accent color.
- The arc line looking like a chart (axes, gridlines, dots on the line).
- Motion that doesn't answer something the person did, other than the shelf drift.
