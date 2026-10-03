import { ARC_NAMES, ATTENTION, cap, runtime } from '../components/FilmCard.jsx'
import { COMPARE_MAX } from '../lists.js'

// S5, Compare: up to three picks side by side across tone, ending feel, bandwidth, runtime and platform (PRD S5).
// One plain table on the page background, the card's caption/body pairs as cells, so nothing new is introduced.
// At 390px three columns are tight, so the table scrolls sideways inside its own box, never the page.

const primary = 'inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen'
const link = 'min-h-[44px] text-body underline decoration-1 underline-offset-4'

const ROWS = [
  ['Tone', (c) => c.tone_mix.map((t) => `${cap(t.tone)} ${t.pct}%`).join(', ')],
  ['Arc', (c) => ARC_NAMES[c.arc.shape]],
  ['Ending', (c) => cap(c.ending)],
  ['Pace', (c) => cap(c.bandwidth.pace)],
  ['Attention', (c) => ATTENTION[c.bandwidth.attention]],
  ['Weight', (c) => `${c.bandwidth.emotional_weight} of 5`],
  ['Length', (c) => (c.type === 'series' && c.series
    ? `${c.series.seasons} season${c.series.seasons === 1 ? '' : 's'}, ${c.series.episode_min} min episodes`
    : c.runtime_min ? runtime(c.runtime_min) : '—')],
  ['Watch on', (c) => (c.watch_in.length ? c.watch_in.join(', ') : 'Not streaming in India')],
]

export default function Compare({ list, onRemove, onClear, onFind }) {
  if (list.length < 2) {
    return (
      <main className="mx-auto max-w-column px-4 pt-12 pb-16 text-ink dark:text-screen md:pt-16">
        <h1 className="font-display text-headline [text-wrap:balance] md:text-headline-lg">Compare</h1>
        <p role="status" className="mt-4 text-lead">
          {list.length === 0
            ? `Tap “Add to compare” on two or three picks to see them side by side.`
            : `${list[0].title} is waiting. Add one more pick to compare.`}
        </p>
        <button type="button" onClick={onFind} className={`mt-8 ${primary}`}>
          Find something
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-column px-4 pt-12 pb-16 text-ink dark:text-screen md:pt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-headline md:text-headline-lg">Compare</h1>
        <button type="button" onClick={onClear} className={link}>
          Clear all
        </button>
      </div>
      <p className="mt-4 text-lead">Up to {COMPARE_MAX} picks, side by side.</p>

      <div className="relative mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Comparison table">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/20 align-bottom dark:border-screen/20">
              <th scope="col" className="w-24 pb-3"><span className="sr-only">Detail</span></th>
              {list.map((c) => (
                <th key={c.id} scope="col" className="pb-3 pr-4 align-bottom font-normal">
                  <span className="block font-display text-lead">{c.title}</span>
                  <span className="block text-caption tabular">{c.year}</span>
                  <button type="button" onClick={() => onRemove(c)} className="min-h-[44px] text-caption underline decoration-1 underline-offset-4">
                    Remove<span className="sr-only"> {c.title}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, value]) => (
              <tr key={label} className="border-b border-ink/20 align-top dark:border-screen/20">
                <th scope="row" className="py-3 pr-4 text-caption font-normal">{label}</th>
                {list.map((c) => (
                  <td key={c.id} className="py-3 pr-4 text-body tabular">{value(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
