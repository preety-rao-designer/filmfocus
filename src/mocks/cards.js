// Three mock cards in the exact docs/CARD_SCHEMA.md shape. Facts checked against TMDB, JustWatch India and Wikipedia
// on 2026-10-01. Anything that couldn't be confirmed without API keys is null or empty, as the schema rules require.

export const movieCard = {
  id: 'tmdb-movie-20453',
  tmdb_id: 20453,
  type: 'movie',
  title: '3 Idiots',
  original_title: '3 Idiots',
  year: 2009,
  runtime_min: 171,
  series: null,
  languages: ['hi'],
  poster_path: null,
  rating: { source: 'imdb', value: 8.4, votes: 459000 },
  watch_in: [],
  truth: {
    status: 'fiction',
    note: "Loosely adapted from Chetan Bhagat's novel Five Point Someone.",
  },
  honest_read: {
    looks_like: 'A loud, goofy college comedy about three friends.',
    actually_is: 'A big-hearted comedy that turns serious about exam pressure and student suicide, then earns its warm, crowd-pleasing finish.',
  },
  expectation_traps: [
    'People expecting pure comedy are caught off guard by how heavy the middle hour gets.',
  ],
  tone_mix: [
    { tone: 'funny', pct: 40 },
    { tone: 'warm', pct: 25 },
    { tone: 'heartbreaking', pct: 15 },
    { tone: 'hopeful', pct: 20 },
  ],
  arc: { shape: 'rise_fall_rise', start: 'playful', middle: 'crushing', end: 'joyful' },
  ending: 'uplifting',
  spoiler_ending:
    "Ten years on, Farhan and Raju track Rancho down and learn he was studying under someone else's name. He is really Phunsukh Wangdu, a celebrated inventor who runs a school in Ladakh. Pia walks out of her wedding to join him, and Chatur, who bet he'd be the more successful one, is left humbled.",
  bandwidth: { pace: 'steady', attention: 'some_focus', emotional_weight: 3 },
  content_flags: ['self_harm_themes'],
  family: 'family_ok',
  good_for: ['watching with parents', 'when you want to laugh and feel something'],
  skip_if: ['you have under three hours', 'student pressure is close to home right now'],
  vibe: 'Three engineering students push back against a pressure-cooker college and a rigid dean. Broad, quick jokes and songs carry it, but underneath sits a real grief about what marks and parental expectations do to young people, and it ends in pure warmth.',
  confidence: {
    level: 'high',
    sources_read: 8,
    agreement: 'strong',
    generated_at: '2026-10-01',
    refresh_after: null,
  },
}

export const seriesCard = {
  id: 'tmdb-tv-111188',
  tmdb_id: 111188,
  type: 'series',
  title: 'Scam 1992: The Harshad Mehta Story',
  original_title: 'Scam 1992: The Harshad Mehta Story',
  year: 2020,
  runtime_min: null,
  series: {
    seasons: 1,
    episode_min: 50,
    status: 'ended',
    style: 'binge',
    gets_good_after: null,
    later_seasons_note: null,
  },
  languages: ['hi', 'gu'],
  poster_path: null,
  rating: { source: 'imdb', value: 9.2, votes: null },
  watch_in: ['Sony Liv'],
  truth: {
    status: 'true_story',
    note: "Adapted from Sucheta Dalal and Debashis Basu's book on the 1992 securities scam.",
  },
  honest_read: {
    looks_like: 'A slick, fast stock-market thriller.',
    actually_is: 'A patient character study of one ambitious man, more about family, pride and class than about money.',
  },
  expectation_traps: [
    'Viewers expecting heist-style thrills find it slower and more talky, with a lot of market jargon early on.',
  ],
  tone_mix: [
    { tone: 'thrilling', pct: 35 },
    { tone: 'tense', pct: 30 },
    { tone: 'thought-provoking', pct: 20 },
    { tone: 'melancholy', pct: 15 },
  ],
  arc: { shape: 'rise_fall', start: 'hungry', middle: 'giddy', end: 'hollow' },
  ending: 'bittersweet',
  spoiler_ending:
    "Sucheta Dalal's reporting exposes how Harshad used bank money to drive the market. He is arrested, faces hundreds of cases, keeps insisting he was a scapegoat for a broken system, and dies of a heart attack in custody in 2001 before most cases are settled.",
  bandwidth: { pace: 'steady', attention: 'full_focus', emotional_weight: 3 },
  content_flags: ['strong_language'],
  family: 'teens_up',
  good_for: ['a long weekend binge', 'when you want something gripping but grown-up'],
  skip_if: ['you want to half-watch', 'you wanted a breezy heist'],
  vibe: 'A Gujarati boy from a Bombay chawl talks and trades his way to the top of the stock market, and the system he outplayed comes for him. Sharp dialogue, rising swagger, a close family watching it all, and a long, sad slide once the press starts asking questions.',
  confidence: {
    level: 'high',
    sources_read: 9,
    agreement: 'strong',
    generated_at: '2026-10-01',
    refresh_after: null,
  },
}

export const limitedCard = {
  id: 'tmdb-movie-290815',
  tmdb_id: 290815,
  type: 'movie',
  title: 'Court',
  original_title: 'Court',
  year: 2014,
  runtime_min: 116,
  series: null,
  languages: ['mr', 'hi', 'gu', 'en'],
  poster_path: null,
  rating: null,
  watch_in: [],
  truth: { status: 'fiction', note: null },
  honest_read: {
    looks_like: 'A tense courtroom drama about a protest singer on trial.',
    actually_is: 'A quiet, observational film about how slowly and coldly the system grinds, with long still takes and no big courtroom showdown.',
  },
  expectation_traps: [
    'People expecting a legal thriller find almost no drama in the trial itself.',
  ],
  tone_mix: [
    { tone: 'thought-provoking', pct: 50 },
    { tone: 'melancholy', pct: 30 },
    { tone: 'dark', pct: 10 },
    { tone: 'funny', pct: 10 },
  ],
  arc: { shape: 'fall', start: 'curious', middle: 'weary', end: 'uneasy' },
  ending: 'unsettling',
  spoiler_ending:
    "Narayan Kamble finally gets bail, only to be arrested again on a fresh charge just as the court closes for its summer break. The last scene follows the judge on holiday, where he dozes off and then slaps a child who wakes him.",
  bandwidth: { pace: 'slow', attention: 'full_focus', emotional_weight: 3 },
  content_flags: ['disturbing_themes'],
  family: 'teens_up',
  good_for: ['when you want to think, not be entertained', 'a quiet solo watch'],
  skip_if: ['you are tired tonight', 'you need a plot that moves'],
  vibe: 'An ageing folk singer is tried in a Mumbai sessions court over a song he may have sung. The camera sits back and watches lawyers, a judge and a grieving widow go home to ordinary lives, while the case drags on with no one in a hurry.',
  confidence: {
    level: 'limited',
    sources_read: 3,
    agreement: 'thin',
    generated_at: '2026-10-01',
    refresh_after: null,
  },
}

export const mockCards = [movieCard, seriesCard, limitedCard]
