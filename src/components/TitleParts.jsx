import { Fragment, useId, useState } from 'react'
import { splitPlatforms, watchLink } from '../platforms.js'
import { btn, primary } from '../ui.js'

// The parts every title shows in V2 ("The Late Show", docs/DESIGN_DIRECTION.md), on results and on its own page:
// the facts line, the honest read (looks like / actually is), the actions, and the details below the backdrop.
// Data from docs/CARD_SCHEMA.md.

const LANGUAGES = {
  hi: 'Hindi', en: 'English', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ko: 'Korean', ja: 'Japanese', es: 'Spanish', fr: 'French',
}

export const ARC_NAMES = {
  rise: 'Climbs all the way',
  fall: 'Slides all the way down',
  fall_rise: 'Falls, then climbs out',
  rise_fall: 'Rises, then falls',
  rise_fall_rise: 'Up, down, up again',
  fall_rise_fall: 'Down, up, down again',
}

// One smooth stroke per story shape, in a 300×60 box (top = feels good). Control points are slightly
// uneven on purpose so the line feels drawn rather than plotted.
const ARC_PATHS = {
  rise: 'M2 52 C 60 50, 110 44, 160 32 S 250 12, 298 7',
  fall: 'M2 8 C 60 10, 110 17, 160 28 S 250 47, 298 53',
  fall_rise: 'M2 12 C 50 15, 95 51, 148 52 S 248 24, 298 9',
  rise_fall: 'M2 50 C 52 46, 98 10, 150 9 S 250 37, 298 51',
  rise_fall_rise: 'M2 40 C 30 33, 62 11, 98 12 S 160 51, 198 50 S 268 15, 298 8',
  fall_rise_fall: 'M2 16 C 32 25, 64 48, 100 47 S 162 10, 200 11 S 270 43, 298 52',
}

export const TRUTH = { true_story: 'True story.', inspired_by: 'Inspired by real events.', fiction: 'Fiction.' }
export const ATTENTION = { background_ok: 'Fine in the background', some_focus: 'Some focus', full_focus: 'Full focus' }
// Tone segments are shades of Paper, not hues.
const TONE_SHADES = ['bg-paper', 'bg-paper/60', 'bg-paper/35', 'bg-paper/20', 'bg-paper/10']

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function runtime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

function compactVotes(n) {
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

function factsParts(card) {
  const parts = [card.type === 'series' ? 'Series' : 'Movie', card.year]
  if (card.type === 'series' && card.series) {
    const s = card.series
    parts.push(`${s.seasons} ${s.seasons === 1 ? 'season' : 'seasons'}`)
    if (s.episode_min) parts.push(`${s.episode_min}-min episodes`)
    parts.push(s.status === 'ended' ? 'Ended' : 'Ongoing')
  } else if (card.runtime_min) {
    parts.push(runtime(card.runtime_min))
  }
  parts.push(card.languages.map((l) => LANGUAGES[l] || l).join(', '))
  if (card.rating) {
    const src = card.rating.source === 'imdb' ? 'IMDb' : 'TMDB'
    parts.push(
      <>
        {card.rating.value} on {src}
        {card.rating.votes ? ` (${compactVotes(card.rating.votes)} votes)` : ''}
      </>,
    )
  }
  return parts
}

export function Facts({ card }) {
  return (
    <p className="mt-3 text-caption text-muted tabular md:mt-4">
      {factsParts(card).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className="whitespace-nowrap">{part}</span>
        </Fragment>
      ))}
    </p>
  )
}

export function seriesLine(series) {
  const parts = [series.style === 'binge' ? 'Made for bingeing.' : 'Works an episode at a time.']
  if (series.gets_good_after) parts.push(`Gets good after ${series.gets_good_after}.`)
  if (series.later_seasons_note) parts.push(series.later_seasons_note)
  return parts.join(' ')
}

// The product's core idea, always read before anything else about the title.
export function HonestRead({ card }) {
  return (
    <div className="mt-8 grid gap-5 md:mt-10 md:gap-6">
      <p className="text-caption text-muted">
        <span className="mb-1 block text-label font-medium tracking-wide text-paper/50">Looks like</span>
        {card.honest_read.looks_like}
      </p>
      <p className="text-read [text-wrap:pretty] md:text-read-lg">
        <span className="mb-2 block text-label font-medium tracking-wide text-amber">Actually is</span>
        {card.honest_read.actually_is}
      </p>
    </div>
  )
}

// A line with the amber rule: why this fits (on results) or the truth note (on a title's page).
export function Aside({ children }) {
  return <p className="mt-6 max-w-read border-l border-amber/70 pl-4 text-caption text-muted md:text-body">{children}</p>
}

// The primary action opens the person's own service first (src/platforms.js), else the first one it streams on.
export function Actions({ card, lists, extra }) {
  const { yours, others } = splitPlatforms(card.watch_in, lists.mine)
  const first = yours[0] || others[0]
  const saved = lists.savedIds.includes(card.id)
  const comparing = lists.compareIds.includes(card.id)
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
      {first && (
        <a
          href={watchLink(first, card.title)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => lists.onWatch(card, first)}
          className={`${primary} col-span-2`}
        >
          Watch on {first} <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      <button type="button" aria-pressed={saved} onClick={() => lists.onSave(card)} className={btn}>
        {saved ? 'On your watchlist' : 'Add to watchlist'}
      </button>
      <button
        type="button"
        aria-pressed={comparing}
        disabled={lists.compareFull && !comparing}
        onClick={() => lists.onCompare(card)}
        className={btn}
      >
        {comparing ? 'In compare' : lists.compareFull ? 'Compare is full' : 'Compare'}
      </button>
      {extra}
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="border-t border-line py-5">
      {title && <h3 className="mb-3 text-caption font-medium text-muted">{title}</h3>}
      {children}
    </div>
  )
}

function ArcLine({ arc }) {
  return (
    <Panel title={`How it feels · ${ARC_NAMES[arc.shape]}`}>
      <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="block h-[72px] w-full overflow-visible" aria-hidden="true">
        <path d={ARC_PATHS[arc.shape]} fill="none" className="stroke-amber" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 grid grid-cols-3 text-caption text-muted [&>*:nth-child(2)]:text-center [&>*:nth-child(3)]:text-right">
        <span>{arc.start}</span>
        <span>{arc.middle}</span>
        <span>{arc.end}</span>
      </div>
    </Panel>
  )
}

function ToneMix({ tones }) {
  return (
    <Panel title="Tone">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-pill" aria-hidden="true">
        {tones.map((t, i) => <span key={t.tone} className={TONE_SHADES[i]} style={{ width: `${t.pct}%` }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted tabular">
        {tones.map((t, i) => (
          <li key={t.tone} className="flex items-center gap-2">
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${TONE_SHADES[i]}`} />
            {cap(t.tone)} {t.pct}%
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Pairs({ card }) {
  const rows = [
    ['Ending', cap(card.ending)],
    ['Pace', cap(card.bandwidth.pace)],
    ['Attention', ATTENTION[card.bandwidth.attention]],
    ['Weight', `${card.bandwidth.emotional_weight} of 5`],
  ]
  return (
    <Panel>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-caption text-muted">{k}</dt>
            <dd className="font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

// Each name opens that service's search for the title. Services the person has come first.
function PlatformLinks({ names, card, onWatch }) {
  return names.map((p, i) => (
    <span key={p}>
      {i > 0 && (i === names.length - 1 ? ' or ' : ', ')}
      <a
        href={watchLink(p, card.title)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onWatch(card, p)}
        className="underline decoration-amber decoration-1 underline-offset-4"
      >
        {p}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </span>
  ))
}

function WhereToWatch({ card, lists }) {
  if (card.watch_in.length === 0) return <Panel><p>Not streaming in India right now.</p></Panel>
  const { yours, others } = splitPlatforms(card.watch_in, lists.mine)
  return (
    <Panel>
      {yours.length ? (
        <p>
          You have it on <PlatformLinks names={yours} card={card} onWatch={lists.onWatch} />.
          {others.length > 0 && <> Also on <PlatformLinks names={others} card={card} onWatch={lists.onWatch} />.</>}
        </p>
      ) : (
        <p>Watch on <PlatformLinks names={others} card={card} onWatch={lists.onWatch} />.</p>
      )}
    </Panel>
  )
}

function Ending({ card }) {
  const [open, setOpen] = useState(false)
  const uid = useId().replace(/:/g, '')
  return (
    <Panel>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`spoiler-${uid}`}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between text-left font-medium"
      >
        {open ? 'Hide the ending' : 'Read how it ends'}
        <span aria-hidden="true" className="text-title font-thin text-muted">{open ? '–' : '+'}</span>
      </button>
      {open && <p id={`spoiler-${uid}`} className="mt-2 text-muted">{card.spoiler_ending}</p>}
    </Panel>
  )
}

// Below the backdrop: how it feels, tone, the four pairs, where to watch and the folded-away ending.
export function Details({ card, lists }) {
  return (
    <div className="md:grid md:grid-cols-[1.3fr_1fr] md:gap-12">
      <div>
        <ArcLine arc={card.arc} />
        <ToneMix tones={card.tone_mix} />
      </div>
      <div>
        <Pairs card={card} />
        {card.type === 'series' && card.series && <Panel><p className="text-muted">{seriesLine(card.series)}</p></Panel>}
        <WhereToWatch card={card} lists={lists} />
        <Ending card={card} />
        {card.confidence?.level === 'limited' && <p className="text-caption text-muted">Based on limited reactions.</p>}
      </div>
    </div>
  )
}

// Only on a title's own page, where there's room: who it suits, who should skip it, and what not to expect.
export function Lists({ card }) {
  const groups = [
    ['Good for', card.good_for.map(cap)],
    ['Skip it if', card.skip_if.map(cap)],
    ["Don't go in", card.expectation_traps],
  ].filter(([, items]) => items?.length)
  return (
    <div className="grid border-t border-line pt-5 md:grid-cols-3 md:gap-12">
      {groups.map(([title, items]) => (
        <div key={title} className="mb-4">
          <h3 className="mb-3 text-caption font-medium text-muted">{title}</h3>
          <ul className="list-disc pl-5 marker:text-amber">
            {items.map((x) => <li key={x} className="mb-2">{x}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
