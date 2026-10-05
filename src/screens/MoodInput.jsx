import { useState } from 'react'
import Shelf from '../components/Shelf.jsx'
import { chip, primary, quiet } from '../ui.js'

// S1, Home (V2, docs/DESIGN_DIRECTION.md): the headline on the left, the mood box, chips and "Find my watch" on the
// right (stacked on phones), and the drifting shelf of posters below. The row holds one chip per question; tapping a
// chip opens its answers under the row, and a chosen chip shows the answer.

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

export default function MoodInput({ text, chips, onText, onChip, onFind, onSurprise, onOpen, children }) {
  const [open, setOpen] = useState(null)
  const canFind = text.trim().length > 0 || Object.values(chips).some(Boolean)

  return (
    <main>
      <form
        className="mx-auto max-w-page px-4 pt-12 pb-8 md:grid md:grid-cols-[1.1fr_1fr] md:items-start md:gap-16 md:px-12 md:pt-16 md:pb-12"
        onSubmit={(e) => {
          e.preventDefault()
          if (canFind) onFind()
        }}
      >
        <h1 id="mood-heading" className="mb-6 text-headline font-bold md:-mt-2 md:mb-0 md:text-headline-lg">
          What are you <span className="block font-thin">in the mood for?</span>
        </h1>

        <div>
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
            className="block min-h-[128px] w-full resize-y rounded-box border border-line bg-night-raised px-5 py-4 text-lead text-paper"
          />

          <div className="mt-4">
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
                <p className="text-caption text-muted">{g.label}</p>
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

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="submit" disabled={!canFind} className={primary}>
              Find my watch
            </button>
            <button type="button" onClick={onSurprise} className={`${quiet} text-body`}>
              Surprise me
            </button>
          </div>
        </div>
      </form>
      {children}
      <Shelf onOpen={onOpen} />
    </main>
  )
}
