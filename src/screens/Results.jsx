import FilmCard from '../components/FilmCard.jsx'
import { CHIP_GROUPS } from './MoodInput.jsx'

// S2, Results. Three FilmCards on rose, mint and marigold, 24px apart, and "Show me three others" below.
// Refine chips, the follow-up question and the loading variant come in later phases.

const TINT_ORDER = ['rose', 'mint', 'marigold']

// What the person asked for, in their words and the chip labels they tapped.
function askedFor(text, chips) {
  const parts = []
  if (text.trim()) parts.push(`“${text.trim()}”`)
  for (const g of CHIP_GROUPS) {
    const opt = g.options.find(([v]) => v === chips[g.key])
    if (opt) parts.push(opt[1])
  }
  return parts.length ? parts.join(' · ') : 'A surprise'
}

export default function Results({ text, chips, picks, onOthers, onChangeMood }) {
  return (
    <main className="mx-auto max-w-column px-4 pt-8 pb-16">
      <h1 className="sr-only">Your three picks</h1>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-ink dark:text-screen">
        <p className="text-body">For {askedFor(text, chips)}</p>
        <button type="button" onClick={onChangeMood} className="min-h-[44px] text-body underline decoration-1 underline-offset-4">
          Change my mood
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {picks.map((p, i) => (
          // The one animation moment: tickets pushed through the counter window, 80ms apart (index.css .ticket-in).
          <div key={p.card.id} className="ticket-in" style={{ animationDelay: `${i * 80}ms` }}>
            <FilmCard card={p.card} why={p.why_this_fits} tint={TINT_ORDER[i]} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOthers}
        className="mt-8 inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen"
      >
        Show me three others
      </button>
    </main>
  )
}
