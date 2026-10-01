# Film card schema

The single shape every part of FilmFocus agrees on: the mock engine (Phase 2), the card pipeline and matching engine (Phase 3), the card store (Launch) and the UI. Change it here first, then everywhere else.

## Fixed vocabularies

**Tones** (tone mix uses only these): warm, funny, romantic, hopeful, uplifting, nostalgic, whimsical, thrilling, tense, scary, dark, melancholy, heartbreaking, thought-provoking, chaotic.

**Arc shapes** (after Vonnegut / Reagan et al.):

| id | Plain name shown on card | Shape |
|---|---|---|
| `rise` | Climbs all the way | steady rise |
| `fall` | Slides all the way down | steady fall |
| `fall_rise` | Falls, then climbs out | valley |
| `rise_fall` | Rises, then falls | hill |
| `rise_fall_rise` | Up, down, up again | Cinderella |
| `fall_rise_fall` | Down, up, down again | Oedipus |

**Ending payoff:** uplifting, bittersweet, devastating, open, cathartic, unsettling.

**Truth status:** `true_story`, `inspired_by`, `fiction`.

**Pace:** slow, steady, fast. **Attention:** background_ok, some_focus, full_focus. **Emotional weight:** 1–5.

**Content flags:** violence, gore, sexual_content, strong_language, substance_use, self_harm_themes, disturbing_themes.

**Family watchability:** `family_ok`, `teens_up`, `adults_only`.

**Confidence:** high, medium, limited.

## Shape

```json
{
  "id": "tmdb-movie-1402",
  "tmdb_id": 1402,
  "type": "movie",
  "title": "The Pursuit of Happyness",
  "original_title": "The Pursuit of Happyness",
  "year": 2006,
  "runtime_min": 117,
  "series": null,
  "languages": ["en"],
  "poster_path": "/example.jpg",
  "rating": { "source": "tmdb", "value": 7.9, "votes": 9000 },
  "watch_in": ["Netflix"],
  "truth": {
    "status": "true_story",
    "note": "Based on Chris Gardner's own years of homelessness."
  },
  "honest_read": {
    "looks_like": "A feel-good, inspirational underdog drama.",
    "actually_is": "A mostly stressful, draining watch about poverty and exhaustion, with a hopeful last stretch."
  },
  "expectation_traps": [
    "Many viewers expected an uplifting watch and found it emotionally exhausting."
  ],
  "tone_mix": [
    { "tone": "tense", "pct": 45 },
    { "tone": "melancholy", "pct": 35 },
    { "tone": "hopeful", "pct": 20 }
  ],
  "arc": {
    "shape": "fall_rise",
    "start": "hopeful",
    "middle": "desperate",
    "end": "relieved"
  },
  "ending": "cathartic",
  "spoiler_ending": "Full plain-language description of how it ends, shown only on tap.",
  "bandwidth": { "pace": "steady", "attention": "some_focus", "emotional_weight": 4 },
  "content_flags": [],
  "family": "family_ok",
  "good_for": ["when you want a cathartic cry", "watching with parents"],
  "skip_if": ["you're already low tonight", "you wanted something light"],
  "vibe": "A father and son hold on through homelessness in 1980s San Francisco. Quietly relentless pressure, small humiliations, deep tenderness between them, and a release at the very end that lands because of everything before it.",
  "confidence": {
    "level": "high",
    "sources_read": 9,
    "agreement": "strong",
    "generated_at": "2026-10-01",
    "refresh_after": null
  }
}
```

For series, `runtime_min` is `null` and `series` is:

```json
{ "seasons": 3, "episode_min": 45, "status": "ended", "style": "binge", "gets_good_after": "episode 3", "later_seasons_note": "Season 3 is noticeably darker." }
```

`style` is `binge` or `episodic`. `gets_good_after` and `later_seasons_note` may be `null`.

## Rules the pipeline must enforce

- `tone_mix`: 3–5 entries, only vocabulary tones, percentages sum to 100.
- `honest_read.actually_is` and `vibe` contain no spoilers. Only `spoiler_ending` may.
- `truth.status` must agree with Wikidata when Wikidata has a "based on" or "main subject" statement; if the model disagrees, Wikidata wins and confidence drops a level.
- Every written field is the model's own words. Never copied review text.
- `watch_in` is India region only, from TMDB watch providers. Empty list is allowed and shown as "Not streaming in India right now".
- Anything the sources don't support is `null`, never guessed.

## The engine's response shape (mock and real)

```json
{
  "followup": null,
  "picks": [
    { "card": { "...": "full card" }, "why_this_fits": "You said you want warm but not dumb; this is gentle and sharp." }
  ],
  "understood": {
    "mood": "tired, wants comfort",
    "stay_or_shift": "shift",
    "company": "alone",
    "time": "movie",
    "attention": "some_focus",
    "languages": ["hi", "en"],
    "platforms": ["Netflix", "JioHotstar"],
    "hard_nos": ["gore"]
  }
}
```

When the input has an important gap, `picks` is empty and `followup` is `{ "question": "Stay in this mood or get out of it?", "options": ["Comfort me", "Cheer me up", "Let me feel it", "Distract me"], "slot": "stay_or_shift" }`.
