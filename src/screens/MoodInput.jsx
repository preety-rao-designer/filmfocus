import { useState } from 'react'

// S1, Mood input. Per docs/DESIGN_DIRECTION.md "Screens": one Rozha One headline, a large text box, "a row of optional
// pill chips beneath", one Curtain pill "Find my three", "Surprise me" as a quiet text link. Nothing else.
// The row holds one chip per question; tapping a chip opens its answers under the row, and a chosen chip shows the answer.

export const CHIP_GROUPS = [
  {
    key: 'company',
    label: "Who's watching",
    options: [
      ['alone', 'Just me'],
      ['partner', 'With my partner'],
      ['friends', 'With friends'],
      ['family', 'With family'],
      ['kids', 'With kids'],
    ],
  },
  {
    key: 'time',
    label: 'How long',
    options: [
      ['movie', 'One movie'],
      ['few_episodes', 'A few episodes'],
      ['binge', 'Something to binge'],
    ],
  },
  {
    key: 'stay_or_shift',
    label: 'Stay in this mood or shift it',
    options: [
      ['comfort', 'Comfort me'],
      ['cheer', 'Cheer me up'],
      ['feel', 'Let me feel it'],
      ['distract', 'Distract me'],
      ['thrill', 'Thrill me'],
    ],
  },
]

// Same pill as the card's footer; chosen is a filled pill (a change of fill and contrast, plus aria-pressed), not a hue.
const chip =
  'inline-flex min-h-[44px] items-center rounded-pill border px-4 text-caption font-medium ' +
  'border-ink/40 text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-screen ' +
  'dark:border-screen/40 dark:text-screen dark:aria-pressed:border-screen dark:aria-pressed:bg-screen dark:aria-pressed:text-ink'

export default function MoodInput({ text, chips, onText, onChip, onFind, onSurprise }) {
  const [open, setOpen] = useState(null)
  const canFind = text.trim().length > 0 || Object.values(chips).some(Boolean)

  return (
    <form
      className="mx-auto max-w-column px-4 pt-12 pb-16 md:pt-16"
      onSubmit={(e) => {
        e.preventDefault()
        if (canFind) onFind()
      }}
    >
      <h1 id="mood-heading" className="font-display text-headline text-ink dark:text-screen md:text-headline-lg">
        What are you in the mood for?
      </h1>

      <textarea
        aria-labelledby="mood-heading"
        value={text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => {
          // Enter finds; Shift+Enter makes a new line.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (canFind) onFind()
          }
        }}
        rows={4}
        placeholder="Rough day. Want something warm but not dumb."
        className="mt-8 block w-full resize-none border border-ink/40 bg-transparent p-4 text-lead text-ink placeholder:text-ink/50 dark:border-screen/40 dark:text-screen dark:placeholder:text-screen/50"
      />

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {CHIP_GROUPS.map((g) => {
            const chosen = g.options.find(([v]) => v === chips[g.key])
            return (
              <button
                key={g.key}
                type="button"
                aria-expanded={open === g.key}
                aria-controls={`answers-${g.key}`}
                aria-pressed={Boolean(chosen)}
                onClick={() => setOpen(open === g.key ? null : g.key)}
                className={chip}
              >
                {chosen ? chosen[1] : g.label}
              </button>
            )
          })}
        </div>
        {CHIP_GROUPS.filter((g) => g.key === open).map((g) => (
          <div key={g.key} id={`answers-${g.key}`} role="group" aria-label={g.label} className="mt-4">
            <p className="text-caption text-ink dark:text-screen">{g.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.options.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chips[g.key] === value}
                  onClick={() => {
                    onChip(g.key, chips[g.key] === value ? null : value)
                    setOpen(null)
                  }}
                  className={chip}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button
          type="submit"
          disabled={!canFind}
          className="inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen disabled:opacity-50"
        >
          Find my three
        </button>
        <button
          type="button"
          onClick={onSurprise}
          className="min-h-[44px] text-body text-ink underline decoration-1 underline-offset-4 dark:text-screen"
        >
          Surprise me
        </button>
      </div>
    </form>
  )
}
