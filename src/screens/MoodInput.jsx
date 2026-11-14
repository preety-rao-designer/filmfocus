import { useRef, useState } from 'react'
import Backdrop from '../components/Backdrop.jsx'
import Strip from '../components/Shelf.jsx'
import { backdropUrl, chip, primary, quiet } from '../ui.js'

// S1, Home (V2.1, docs/DESIGN_DIRECTION.md): one dramatic screen. The slanted strip of posters drifts down the left
// (across the top on phones); the film at its middle lights up and its still fills the background. The question sits
// on the right: headline, mood box, chips, "Find my watch" and "Surprise me". The row holds one chip per question;
// tapping a chip opens its answers under the row, and a chosen chip shows the answer.

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
  const [lit, setLit] = useState(null)
  const [nudge, setNudge] = useState(false)
  const box = useRef(null)
  const canFind = text.trim().length > 0 || Object.values(chips).some(Boolean)
  // "Find my watch" always looks ready; with nothing to go on it says what it needs instead of doing nothing.
  const tryFind = () => {
    if (canFind) return onFind()
    setNudge(true)
    box.current?.focus()
  }

  return (
    <main>
      <section className="relative overflow-hidden md:min-h-[100svh]">
        <Backdrop url={backdropUrl(lit)} scrim="scrim-home" />
        <Strip onOpen={onOpen} onFocus={setLit} />
      <form
        className="relative mx-auto max-w-page px-4 pt-6 pb-12 md:flex md:min-h-[100svh] md:items-center md:py-[112px] md:pr-12 md:pl-[calc(4vw+330px)] lg:pl-[calc(4vw+390px)]"
        onSubmit={(e) => {
          e.preventDefault()
          tryFind()
        }}
      >
        <div className="w-full max-w-[600px]">
        <h1 id="mood-heading" className="mb-6 text-headline font-bold md:mb-8 md:text-headline-lg">
          What are you <span className="block font-normal">in the mood for?</span>
        </h1>

        <div>
          <textarea
            ref={box}
            aria-labelledby="mood-heading"
            value={text}
            onChange={(e) => {
              onText(e.target.value)
              setNudge(false)
            }}
            onKeyDown={(e) => {
              // Enter finds; Shift+Enter makes a new line.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                tryFind()
              }
            }}
            rows={4}
            placeholder="Rough day. Want something warm but not dumb."
            className="block min-h-[128px] w-full resize-y rounded-box border border-line bg-night-raised/90 px-5 py-4 text-lead text-paper"
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
                        setNudge(false)
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
            <button type="submit" className={primary}>
              Find my watch
            </button>
            <button type="button" onClick={onSurprise} className={`${quiet} text-body`}>
              Surprise me
            </button>
          </div>
          <p role="status" className="mt-3 min-h-[1.5em] text-caption text-muted">
            {nudge ? 'Type how you feel, or pick a chip, then find your watch.' : ''}
          </p>
        </div>
        </div>
      </form>
      </section>
      {children}
    </main>
  )
}
