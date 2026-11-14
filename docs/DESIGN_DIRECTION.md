# FilmFocus design direction: "The Late Show" (V2)

Status: approved by Preety on 2026-10-05 from the mock in `docs/design/v2/mock.html`. **V2.1 (2026-11-14, Preety's ask):** a dramatic home with a slanted poster strip on the left and the question on the right, from a game character-select screen she shared; plus fixes to the headline weight, the home button, results legibility and wordiness. Changes are marked V2.1 below. It replaces V1, "The Single Screen" (paper tickets), which is in git history. The approved mock and the V2 snaps in `docs/design/snaps/v2-*` are the bar every screen is measured against.

## The idea in one sentence

FilmFocus feels like the late show: the room goes dark, one film fills the screen, and a friend tells you honestly what it really is. Three picks, one in focus at a time.

## Where it comes from (Preety's references)

| Reference | What we take | What we leave |
|---|---|---|
| A Kurosawa VHS shelf site (spines on a shelf, the chosen tape pulled forward, title and year under it) | The shelf: a row of titles you can browse, one pulled forward when chosen | VHS skeuomorphism, distressed textures, decade filters |
| The "Modern Netflix website" concept by Sandhill Studio (tall poster strips that widen on hover, a strip opening into a full-width still) | The home shelf of tall strips that widen and show the title; a title opening into its backdrop | Genre labels on strips, the side menu, the brand |
| A game character-select screen (V2.1: a slanted column of portraits on the left, a bold full-bleed scene behind, details on the right) | The home: a slanted strip of posters down the left, the question on the right | The chosen-one frame (no film is singled out on home), the game UI, stats bars, the flat red |
| A red velvet stage curtain under a spotlight (V2.1) | The home background: maroon velvet folds, a spotlight from above, dark edges and floor | The photo itself (drawn in CSS instead), the stage podium |
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
| Velvet (V2.1) | deep `#1C0508`, `#4A0D15`, lit `#8E2430` | The home curtain only: the cloth, its folds and the spotlight. Never text, buttons or state. |

Images come only from TMDB (posters and backdrops), credited in the footer.

## Type

- **One family: Inter Tight** (Google Fonts) at 200 / 400 / 500. V2.1, "minimal, clean, not too bold and big": medium (500) for titles, the first line of headlines, the primary button and the wordmark; regular (400) for the second line of headlines ("What are you / *in the mood for?*") and body; thin (200) only for the numerals 01–03. No bold (700).
- **Indian scripts:** Noto Sans Devanagari is loaded; Tamil, Telugu, Malayalam, Kannada, Bengali and Gujarati fall back to their Noto Sans families.
- Tabular figures for runtimes, ratings, percentages and counts.

**Scale (px, phone / desktop):** 12 label, 14 caption, 16 body, 18 lead, 20 / 24 the "Actually is" read, 30 / 44 title, 32 / 52 headline, 44 / 64 numeral. (V2.1; was 34 / 54 title, 44 / 80 headline, 56 / 88 numeral.) Tracking about -0.02em on titles and headlines, line height about 1.06–1.1.

**Hierarchy in the focused pick** (revised 2026-10-06 after "noisy and tight"): the title leads; the numeral is thin Paper at 40% so it marks position without competing; the facts are one even Muted line; "Actually is" is the one big read, with 32–40px of air above the read block and 20–24px between "Looks like" and it; why it fits is a smaller Muted aside; secondary buttons are regular weight so only the Amber one is bold. The "For …" line stays on one line, cut short if long, with "Change my mood" always in view. Line height 1.5 for text, 1.4 for the read, about 1.0 for titles and headlines with tight tracking. Sentence case everywhere; no all-caps labels.

## Spacing and shape

- 4px base: 4, 8, 12, 16, 20, 24, 32, 48, 64.
- Page content up to 1240px wide; 16px gutters on phones, 48px on desktop. Reading text is held to about 560–640px.
- Radius: posters 10px, the mood box 20px, buttons and chips pill. Nothing else is rounded.
- No drop shadows. Depth comes from the images and the scrims.
- V2.1: the home strip leans like "/" (skewed 7° on desktop, 5° on phones); the posters inside are skewed back so faces aren't sheared. Nothing else is slanted.
- V2.1: the home curtain is the one place with gradients and texture: pleats at two widths, a fine grain, a spotlight from above (over the question on desktop, centred on phones) and a vignette. Amber stays the one accent.

## Screens

- **Home (V2.1):** one screen-high scene in front of the velvet curtain. Desktop: a slanted strip of poster tiles down the left that drifts slowly upward; the question sits on the right, vertically centred, under the spotlight: headline, mood box, chips, "Find my watch" (Amber) and "Surprise me". Phones: the strip becomes a band across the top, tilted the same way, drifting sideways; the question follows below. No tile is singled out: all are the same, slightly dimmed. Hover or focus brightens a tile, shows its title and stops the drift; wheel, swipe or drag move the strip; a tap opens the title's page. Same daily mix of titles (two Indian for every one from elsewhere). "Find my watch" always looks ready: with nothing typed or chosen, it puts the cursor in the box and says "Type how you feel, or pick a chip, then find your watch."
- **Results:** the focused pick's backdrop fills the screen under a scrim. On it: "For …" with "Change my mood", the numeral and title, the facts line, the honest read, why it fits (with an Amber rule), and the actions. All three posters sit beside it on desktop and above it on phones, so the three are always in view. V2.1: the scrim is darker under the posters on desktop; on phones the "For …" line wraps to two lines, and Regenerate is a quiet link beside "Change my mood" instead of a button under the posters. The facts line gives the rating without the vote count, and why it fits is one short line (16 words at most). Tapping another poster (or ← → keys) moves the focus; tapping the focused one opens its page. Under the posters, **Regenerate** (outline pill with a circular-arrow icon) brings three different picks. Below the backdrop: how it feels, tone, the four pairs, where to watch, "Read how it ends" (folded).
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
- V2.1: the home strip drifts about 18px a second (16 on phones) when nobody is touching it; a tile brightens on hover or focus (400ms).
- Under `prefers-reduced-motion`, nothing drifts or fades; things simply change.

## Voice

Plain, warm, a little dry, unchanged from V1. "This one looks like a comedy. It isn't, really." Buttons say exactly what happens. Errors say what went wrong and what to do.

## What would count as a miss

- A browsing grid of many posters on results (results is always three).
- The honest read looking secondary to the title, the rating or the imagery.
- Text over a bright part of an image without a scrim.
- More than one Amber primary action in a view, or a second accent color.
- The arc line looking like a chart (axes, gridlines, dots on the line).
- Motion that doesn't answer something the person did, other than the strip drift.
