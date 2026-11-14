import { useRef, useState } from 'react'
import Strip from '../components/Shelf.jsx'
import { chip, primary, quiet } from '../ui.js'

// A smaller, quieter chip for the compact versions of the question.
const softChip =
  'inline-flex min-h-[36px] items-center rounded-pill border border-paper/15 px-3 text-caption text-paper/80 hover:border-paper/50 hover:text-paper ' +
  'aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-night'

// S1, Home (V2.1, docs/DESIGN_DIRECTION.md): one screen in front of a maroon velvet curtain with a spotlight from the
// top. The slanted strip of posters drifts down the left (across the top on phones). The question sits on the right: headline, mood box, chips, "Find my watch" and "Surprise me". The row holds one chip per question;
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
  const [nudge, setNudge] = useState(false)
  // Which version of the question block to show while Preety compares them (V2.1 round 3); no param → current.
  const lookParam = new URLSearchParams(window.location.search).get('look')
  const look = ['a', 'b', 'c'].includes(lookParam) ? lookParam : 'now'
  const box = useRef(null)
  const canFind = text.trim().length > 0 || Object.values(chips).some(Boolean)
  // "Find my watch" always looks ready; with nothing to go on it says what it needs instead of doing nothing.
  const tryFind = () => {
    if (canFind) return onFind()
    setNudge(true)
    box.current?.focus()
  }

  // The box grows with what they type instead of starting as a tall empty slab.
  const grow = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  const field = (cls, rows = 1) => (
    <textarea
      ref={(el) => {
        box.current = el
        grow(el)
      }}
      aria-labelledby="mood-heading"
      value={text}
      onChange={(e) => {
        onText(e.target.value)
        setNudge(false)
        grow(e.target)
      }}
      onKeyDown={(e) => {
        // Enter finds; Shift+Enter makes a new line.
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          tryFind()
        }
      }}
      rows={rows}
      placeholder="Rough day. Want something warm but not dumb."
      className={`block w-full resize-none bg-transparent text-paper outline-none placeholder:text-muted ${cls}`}
    />
  )
  const chipRow = (center = false, extra = null) => (
    <div>
      <div className={`flex flex-wrap items-center gap-2 ${center ? 'justify-center' : ''}`}>
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
              className={look === 'now' ? chip : softChip}
            >
              {chosen ? chosen[1] : g.label}
            </button>
          )
        })}
        {extra}
      </div>
      {CHIP_GROUPS.filter((g) => g.key === open).map((g) => (
        <div key={g.key} id={`answers-${g.key}`} role="group" aria-label={g.label} className="mt-4">
          <p className="text-caption text-muted">{g.label}</p>
          <div className={`mt-2 flex flex-wrap gap-2 ${center ? 'justify-center' : ''}`}>
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
                className={look === 'now' ? chip : softChip}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
  const surprise = (
    <button type="button" onClick={onSurprise} className={`${quiet} text-caption`}>
      Surprise me
    </button>
  )
  const nudgeLine = (center = false) => (
    <p role="status" className={`mt-3 min-h-[1.5em] text-caption text-muted ${center ? 'text-center' : ''}`}>
      {nudge ? 'Type how you feel, or pick a chip, then find your watch.' : ''}
    </p>
  )

  let block
  if (look === 'a') {
    // A, "quiet line": no box, a single line to write on with the button at its end; small chips under it.
    block = (
      <div className="w-full max-w-[620px]">
        <h1 id="mood-heading" className="mb-8 text-[30px] font-normal leading-[1.15] tracking-[-.02em] md:text-[44px]">
          What are you <span className="block text-paper/60">in the mood for?</span>
        </h1>
        <div className="flex items-end gap-4 border-b border-paper/30 pb-3 transition-colors focus-within:border-paper">
          {field('min-h-[34px] text-[20px] leading-[1.4] md:text-[22px]')}
          <button type="submit" className={`${primary} shrink-0`}>Find my watch</button>
        </div>
        <div className="mt-5">{chipRow(false, <span className="ml-auto">{surprise}</span>)}</div>
        {nudgeLine()}
      </div>
    )
  } else if (look === 'b') {
    // B, "glass card": the question in one soft, see-through card resting on the curtain.
    block = (
      <div className="w-full max-w-[580px] rounded-[24px] border border-paper/10 bg-night/50 p-8 pb-5 backdrop-blur-md">
        <h1 id="mood-heading" className="mb-6 text-[26px] font-normal leading-[1.2] tracking-[-.015em] md:text-[34px]">
          What are you in the mood for?
        </h1>
        <div className="rounded-[14px] border border-paper/10 bg-paper/5 px-4 py-3 transition-colors focus-within:border-paper/40">
          {field('min-h-[56px] text-lead leading-[1.5]', 2)}
        </div>
        <div className="mt-4">{chipRow()}</div>
        <div className="mt-8 flex items-center gap-6 border-t border-paper/10 pt-6">
          <button type="submit" className={primary}>Find my watch</button>
          {surprise}
        </div>
        {nudgeLine()}
      </div>
    )
  } else if (look === 'c') {
    // C, "spotlight pill": centred under the spotlight; one slim field with the button inside it.
    block = (
      <div className="flex w-full max-w-[620px] flex-col items-center text-center">
        <h1 id="mood-heading" className="mb-8 text-[28px] font-normal leading-[1.15] tracking-[-.02em] [text-wrap:balance] md:text-[40px]">
          What are you in the mood for?
        </h1>
        <div className="flex w-full items-end gap-3 rounded-[28px] border border-paper/15 bg-night/60 py-2 pr-2 pl-6 text-left backdrop-blur-md transition-colors focus-within:border-paper/50">
          {field('min-h-[28px] self-center py-1 text-lead leading-[1.45]')}
          <button type="submit" aria-label="Find my watch" className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-pill bg-amber text-night hover:bg-amber-hover">
            <span aria-hidden="true" className="text-lead">→</span>
          </button>
        </div>
        <div className="mt-5 w-full">{chipRow(true)}</div>
        <div className="mt-4">{surprise}</div>
        {nudgeLine(true)}
      </div>
    )
  } else {
    block = (
      <div className="w-full max-w-[600px]">
        <h1 id="mood-heading" className="mb-6 text-headline font-medium md:mb-8 md:text-headline-lg">
          What are you <span className="block font-normal">in the mood for?</span>
        </h1>
        <div className="rounded-box border border-line bg-night-raised/90 px-5 py-4">{field('min-h-[96px] text-lead', 4)}</div>
        <div className="mt-4">{chipRow()}</div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button type="submit" className={primary}>Find my watch</button>
          <button type="button" onClick={onSurprise} className={`${quiet} text-body`}>Surprise me</button>
        </div>
        {nudgeLine()}
      </div>
    )
  }

  return (
    <main>
      <section className="relative overflow-hidden md:min-h-[100svh]">
        <div aria-hidden="true" className="velvet absolute inset-0" />
        <Strip onOpen={onOpen} />
        <form
          className={`relative mx-auto max-w-page px-4 pt-6 pb-12 md:flex md:min-h-[100svh] md:items-center md:py-[112px] md:pr-12 md:pl-[calc(4vw+330px)] lg:pl-[calc(4vw+390px)] ${look === 'c' ? 'md:justify-center' : ''}`}
          onSubmit={(e) => {
            e.preventDefault()
            tryFind()
          }}
        >
          {block}
        </form>
        {/* Preview only (?look=a|b|c): switch between the three versions of the question to compare them. */}
        {lookParam && (
          <nav aria-label="Compare versions" className="fixed right-4 bottom-4 z-20 flex gap-1 rounded-pill border border-paper/15 bg-night/80 p-1 text-caption backdrop-blur">
            {[['now', 'Current'], ['a', 'A · Quiet line'], ['b', 'B · Glass card'], ['c', 'C · Spotlight pill']].map(([k, label]) => (
              <a key={k} href={`?look=${k}`} aria-current={look === k || undefined} className={`rounded-pill px-3 py-2 ${look === k ? 'bg-paper text-night' : 'text-paper/80 hover:text-paper'}`}>
                {label}
              </a>
            ))}
          </nav>
        )}
      </section>
      {children}
    </main>
  )
}
