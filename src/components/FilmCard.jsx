import { Fragment, useId, useState } from 'react'
import { splitPlatforms, watchLink } from '../platforms.js'

// S3, the film card: a paper ticket. Anatomy and tokens from docs/DESIGN_DIRECTION.md, data from docs/CARD_SCHEMA.md.
// Variants: Movie and Series come from card.type; Loading is `loading` (or no card). Same layout in all three.

const TINTS = { rose: 'bg-rose', mint: 'bg-mint', marigold: 'bg-marigold' }

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

const TRUTH = { true_story: 'True story.', inspired_by: 'Inspired by real events.', fiction: 'Fiction.' }
export const ATTENTION = { background_ok: 'Fine in the background', some_focus: 'Some focus', full_focus: 'Full focus' }
const TONE_SHADES = ['bg-ink', 'bg-ink/70', 'bg-ink/50', 'bg-ink/35', 'bg-ink/20']

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

function factsLine(card) {
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
    parts.push(`${card.rating.value} on ${src}${card.rating.votes ? ` (${compactVotes(card.rating.votes)} votes)` : ''}`)
  }
  return parts
}

export function seriesLine(series) {
  const parts = [series.style === 'binge' ? 'Made for bingeing.' : 'Works an episode at a time.']
  if (series.gets_good_after) parts.push(`Gets good after ${series.gets_good_after}.`)
  if (series.later_seasons_note) parts.push(series.later_seasons_note)
  return parts.join(' ')
}

// Placeholder for the Loading variant: a soft bar sitting in a real line of text, so line heights match and nothing jumps.
function Bar({ chars = 24 }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[0.9em] max-w-full bg-ink/10 align-middle"
      style={{ width: `${chars}ch` }}
    />
  )
}

function Perforation({ id }) {
  const dots = (pid) => (
    <pattern id={pid} width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2" className="fill-brass" />
    </pattern>
  )
  return (
    <div aria-hidden="true" className="relative h-6 md:h-auto md:w-6 shrink-0">
      {/* Notches: page-colored half circles where the perforation meets the edges. */}
      <span className="absolute top-0.5 -left-notch h-[20px] w-[20px] rounded-full bg-screen dark:bg-curtain-deep md:left-0.5 md:-top-notch" />
      <span className="absolute top-0.5 -right-notch h-[20px] w-[20px] rounded-full bg-screen dark:bg-curtain-deep md:top-auto md:right-auto md:left-0.5 md:-bottom-notch" />
      <svg className="absolute inset-x-6 top-[7px] h-[10px] w-[calc(100%-48px)] md:hidden">
        <defs>{dots(`${id}-h`)}</defs>
        <rect width="100%" height="100%" fill={`url(#${id}-h)`} />
      </svg>
      <svg className="absolute inset-y-6 left-[7px] hidden h-[calc(100%-48px)] w-[10px] md:block">
        <defs>{dots(`${id}-v`)}</defs>
        <rect width="100%" height="100%" fill={`url(#${id}-v)`} />
      </svg>
    </div>
  )
}

function ArcLine({ arc }) {
  return (
    <div>
      <p className="text-caption">{arc ? `How it feels: ${ARC_NAMES[arc.shape].toLowerCase()}` : <Bar chars={22} />}</p>
      <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="mt-2 block h-12 w-full overflow-visible" aria-hidden="true">
        {arc ? (
          <path d={ARC_PATHS[arc.shape]} fill="none" className="stroke-curtain" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ) : (
          <path d="M2 30 L 298 30" fill="none" className="stroke-ink/10" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <div className="mt-1 grid grid-cols-3 text-caption [&>*:nth-child(2)]:text-center [&>*:nth-child(3)]:text-right">
        {arc ? (
          <>
            <span>{arc.start}</span>
            <span>{arc.middle}</span>
            <span>{arc.end}</span>
          </>
        ) : (
          <>
            <Bar chars={6} />
            <Bar chars={6} />
            <Bar chars={6} />
          </>
        )}
      </div>
    </div>
  )
}

function ToneMix({ tones }) {
  return (
    <div>
      <p className="text-caption">Tone</p>
      <div className="mt-2 flex h-2 gap-0.5" aria-hidden="true">
        {tones ? (
          tones.map((t, i) => <span key={t.tone} className={TONE_SHADES[i]} style={{ width: `${t.pct}%` }} />)
        ) : (
          <span className="w-full bg-ink/10" />
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 text-caption tabular">
        {tones ? (
          tones.map((t, i) => (
            <li key={t.tone} className="flex items-center gap-1">
              <span aria-hidden="true" className={`inline-block h-2 w-2 ${TONE_SHADES[i]}`} />
              {cap(t.tone)} {t.pct}%
            </li>
          ))
        ) : (
          <li><Bar chars={30} /></li>
        )}
      </ul>
    </div>
  )
}

function Pairs({ card }) {
  const rows = [
    ['Ending', card ? cap(card.ending) : null],
    ['Pace', card ? cap(card.bandwidth.pace) : null],
    ['Attention', card ? ATTENTION[card.bandwidth.attention] : null],
    ['Weight', card ? `${card.bandwidth.emotional_weight} of 5` : null],
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-caption">{k}</dt>
          <dd className="text-body font-medium tabular">{v ?? <Bar chars={8} />}</dd>
        </div>
      ))}
    </dl>
  )
}

// Each name opens that service's search for the title (src/platforms.js). Services the person has come first:
// "You have it on Netflix. Also on Prime Video." Without saved services it reads as before: "Watch on A or B".
function PlatformLinks({ names, title, onWatch }) {
  return names.map((p, i) => (
    <span key={p}>
      {i > 0 && (i === names.length - 1 ? ' or ' : ', ')}
      <a href={watchLink(p, title)} target="_blank" rel="noopener noreferrer" onClick={() => onWatch?.(p)} className="font-medium underline decoration-1 underline-offset-4">
        {p}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </span>
  ))
}

function WhereToWatch({ platforms, title, mine, onWatch }) {
  if (!platforms) return <p className="text-body"><Bar chars={26} /></p>
  if (platforms.length === 0) return <p className="text-body">Not streaming in India right now.</p>
  const { yours, others } = splitPlatforms(platforms, mine)
  if (!yours.length) return <p className="text-body">Watch on <PlatformLinks names={others} title={title} onWatch={onWatch} /></p>
  return (
    <p className="text-body">
      You have it on <PlatformLinks names={yours} title={title} onWatch={onWatch} />.
      {others.length > 0 && <> Also on <PlatformLinks names={others} title={title} onWatch={onWatch} />.</>}
    </p>
  )
}

// On the ticket the pill is always Ink on the tint; on (saved, in compare) is the same filled pill as a chosen chip.
const pill =
  'inline-flex min-h-[44px] items-center rounded-pill border border-ink/40 px-4 text-caption font-medium text-ink disabled:opacity-50 ' +
  'aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-screen'

export default function FilmCard({ card, why, tint = 'rose', loading = false, saved = false, onSave, comparing = false, onCompare, compareFull = false, mine = [], onWatch }) {
  const [revealed, setRevealed] = useState(false)
  const uid = useId().replace(/:/g, '')
  const isLoading = loading || !card
  const c = isLoading ? null : card

  return (
    <article
      aria-busy={isLoading || undefined}
      aria-label={c ? c.title : 'Loading a pick'}
      className={`${TINTS[tint]} relative rounded-ticket text-ink shadow-ticket md:flex`}
    >
      {/* Counterfoil: on the poster */}
      <div className="px-6 pt-6 pb-4 md:w-counterfoil md:shrink-0 md:py-8 md:pr-4">
        <p className="text-caption">On the poster</p>
        <p className="mt-1 text-body">{c ? c.honest_read.looks_like : <Bar chars={30} />}</p>
      </div>

      <Perforation id={`perf-${uid}`} />

      {/* Ticket: in the hall */}
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 pt-4 pb-6 md:py-8 md:pl-4 md:pr-8">
        <div>
          <p className="text-caption">In the hall</p>
          <p className="mt-1 text-lead font-medium">{c ? c.honest_read.actually_is : <><Bar chars={40} /> <Bar chars={22} /></>}</p>
          <p className="mt-2 text-caption">
            {c ? [TRUTH[c.truth.status], c.truth.note].filter(Boolean).join(' ') : <Bar chars={34} />}
          </p>
        </div>

        <div>
          <h3 className="font-display text-title md:text-title-lg">{c ? c.title : <Bar chars={10} />}</h3>
          <p className="mt-2 text-caption tabular">{c
              ? factsLine(c).map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && ' · '}
                    <span className="whitespace-nowrap">{part}</span>
                  </Fragment>
                ))
              : <Bar chars={44} />}</p>
          {c?.type === 'series' && c.series && <p className="mt-1 text-caption">{seriesLine(c.series)}</p>}
        </div>

        <ArcLine arc={c?.arc} />
        <ToneMix tones={c?.tone_mix} />
        <Pairs card={c} />

        {/* The why line belongs to a search; a card opened from the watchlist or compare has none. */}
        {(isLoading || why) && <p className="text-body italic">{c ? why : <Bar chars={36} />}</p>}

        <WhereToWatch platforms={c ? c.watch_in : null} title={c?.title} mine={mine} onWatch={c && onWatch ? (p) => onWatch(c, p) : undefined} />

        <div>
          <div className="flex flex-wrap gap-2">
            {(onSave || isLoading) && (
              <button type="button" className={pill} disabled={isLoading} aria-pressed={saved} onClick={() => onSave?.(c)}>
                {saved ? 'On your watchlist' : 'Add to watchlist'}
              </button>
            )}
            {(onCompare || isLoading) && (
              <button
                type="button"
                className={pill}
                disabled={isLoading || (compareFull && !comparing)}
                aria-pressed={comparing}
                onClick={() => onCompare?.(c)}
              >
                {comparing ? 'In compare' : compareFull ? 'Compare is full' : 'Add to compare'}
              </button>
            )}
            <button
              type="button"
              className={pill}
              disabled={isLoading}
              aria-expanded={revealed}
              aria-controls={`spoiler-${uid}`}
              onClick={() => setRevealed((r) => !r)}
            >
              {revealed ? 'Hide the ending' : 'Read how it ends'}
            </button>
          </div>
          {c && revealed && (
            <p id={`spoiler-${uid}`} className="mt-4 text-body">{c.spoiler_ending}</p>
          )}
        </div>

        {c?.confidence.level === 'limited' && <p className="text-caption">Based on limited reactions.</p>}
      </div>
    </article>
  )
}
