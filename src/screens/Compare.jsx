import { ARC_NAMES, ATTENTION, cap, runtime } from '../components/TitleParts.jsx'
import { COMPARE_MAX } from '../lists.js'
import { posterUrl, primary, quiet } from '../ui.js'

// S5, Compare (V2): up to three titles side by side across tone, ending feel, bandwidth, runtime and platform (PRD S5).
// Posters head the columns (tap for a title's page). At 390px three columns are tight, so the table scrolls sideways
// inside its own box, never the page.

const ROWS = [
  ['Actually is', (c) => c.honest_read.actually_is],
  ['Tone', (c) => c.tone_mix.map((t) => `${cap(t.tone)} ${t.pct}%`).join(', ')],
  ['How it feels', (c) => ARC_NAMES[c.arc.shape]],
  ['Ending', (c) => cap(c.ending)],
  ['Pace', (c) => cap(c.bandwidth.pace)],
  ['Attention', (c) => ATTENTION[c.bandwidth.attention]],
  ['Weight', (c) => `${c.bandwidth.emotional_weight} of 5`],
  ['Length', (c) => (c.type === 'series' && c.series
    ? `${c.series.seasons} season${c.series.seasons === 1 ? '' : 's'}, ${c.series.episode_min} min episodes`
    : c.runtime_min ? runtime(c.runtime_min) : '—')],
  ['Watch on', (c) => (c.watch_in.length ? c.watch_in.join(', ') : 'Not streaming in India')],
]

export default function Compare({ list, onRemove, onClear, onFind, onOpen }) {
  const heading = (
    <h1 className="text-headline font-bold md:text-headline-lg">
      Com<span className="font-thin">pare</span>
    </h1>
  )
  if (list.length < 2) {
    return (
      <main className="mx-auto max-w-page px-4 pt-12 pb-16 md:px-12 md:pt-16">
        {heading}
        <p role="status" className="mt-4 max-w-read text-lead text-muted">
          {list.length === 0
            ? `Tap “Compare” on two or three titles to see them side by side.`
            : `${list[0].title} is waiting. Add one more title to compare.`}
        </p>
        <button type="button" onClick={onFind} className={`mt-8 ${primary}`}>
          Find something
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-page px-4 pt-12 pb-16 md:px-12 md:pt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        {heading}
        <button type="button" onClick={onClear} className={`${quiet} text-body`}>
          Clear all
        </button>
      </div>
      <p className="mt-4 text-lead text-muted">Up to {COMPARE_MAX} titles, side by side.</p>

      <div className="no-scrollbar relative mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Comparison table">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="align-bottom">
              <th scope="col" className="w-28 pb-4"><span className="sr-only">Detail</span></th>
              {list.map((c) => (
                <th key={c.id} scope="col" className="pb-4 pr-6 align-bottom font-normal">
                  <button type="button" onClick={() => onOpen(c)} aria-label={`${c.title}, see its page`} className="block w-[96px] md:w-[140px]">
                    <span className="block aspect-[2/3] rounded-poster bg-night-raised bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl(c)})` }} />
                  </button>
                  <span className="mt-3 block text-lead font-bold">{c.title}</span>
                  <span className="block text-caption text-muted tabular">{c.year}</span>
                  <button type="button" onClick={() => onRemove(c)} className={`${quiet} text-caption`}>
                    Remove<span className="sr-only"> {c.title}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, value]) => (
              <tr key={label} className="border-t border-line align-top">
                <th scope="row" className="py-4 pr-4 text-caption font-normal text-muted">{label}</th>
                {list.map((c) => (
                  <td key={c.id} className="py-4 pr-6 tabular">{value(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
