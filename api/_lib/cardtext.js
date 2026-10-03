// The text a mood is matched against: the vibe, the honest read, tone and arc words, and what it's good for.
// Shared by the seed embedding script and on-demand cards, so both live in the same vector space.
export const embedText = (c) =>
  [
    c.vibe,
    c.honest_read.actually_is,
    `Tone: ${c.tone_mix.map((t) => t.tone).join(', ')}.`,
    `Feels ${c.arc.start}, then ${c.arc.middle}, then ${c.arc.end}; ending ${c.ending}.`,
    `Good for ${c.good_for.join('; ')}.`,
  ].join(' ')
