import FilmCard from '../components/FilmCard.jsx'
import { CHIP_GROUPS, chip } from './MoodInput.jsx'

// S2, Results. Three FilmCards on rose, mint and marigold, 24px apart, and "Show me three others" below.
// In place of the tickets, depending on what really happened: the Loading variant while the engine works, the one
// follow-up question with pill answers, a "nothing fits" line with a one-tap way to loosen, or a plain error and retry.

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

const ERRORS = {
  busy: 'Lots of people are choosing right now. Try again in a moment.',
  offline: "You seem to be offline. Check your connection, then try again.",
  failed: "Couldn't reach our film notes. Try again in a moment.",
}

const primary = 'inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen disabled:opacity-50'

// In-place messages share one quiet block: a 22px line, then the actions. Pill answers sit 8px apart like every
// other chip row; a button and a link sit 24px apart like S1's.
function Note({ children, actions, pills = false }) {
  return (
    <div role="status" className="py-8">
      <p className="text-section [text-wrap:balance]">{children}</p>
      <div className={`mt-6 flex flex-wrap items-center ${pills ? 'gap-2' : 'gap-x-6 gap-y-4'}`}>{actions}</div>
    </div>
  )
}

export default function Results({ text, chips, view, batch, onOthers, onChangeMood, onRetry, onAnswer, onLoosen, lists }) {
  const { status, picks = [], followup, noMatch, error } = view
  const loading = status === 'loading'

  return (
    <main className="mx-auto max-w-column px-4 pt-8 pb-16 text-ink dark:text-screen">
      <h1 className="sr-only">Your three picks</h1>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-body">For {askedFor(text, chips)}</p>
        <button type="button" onClick={onChangeMood} className="min-h-[44px] text-body underline decoration-1 underline-offset-4">
          Change my mood
        </button>
      </div>

      {(loading || status === 'ready') && (
        <>
          <p className="sr-only" role="status">{loading ? 'Finding your three…' : 'Your three are here.'}</p>
          <div className="mt-6 flex flex-col gap-6">
            {TINT_ORDER.map((tint, i) => (
              // The one animation moment: tickets pushed through the counter window, 80ms apart (index.css .ticket-in).
              // Keyed by request, so the slide answers the tap, and the Loading ticket fills in place without moving.
              <div key={`${batch}-${i}`} className="ticket-in" style={{ animationDelay: `${i * 80}ms` }}>
                {loading || !picks[i] ? (
                  <FilmCard loading tint={tint} />
                ) : (
                  <FilmCard
                    key={picks[i].card.id}
                    card={picks[i].card}
                    why={picks[i].why_this_fits}
                    tint={tint}
                    saved={lists.savedIds.includes(picks[i].card.id)}
                    onSave={lists.onSave}
                    comparing={lists.compareIds.includes(picks[i].card.id)}
                    compareFull={lists.compareFull}
                    onCompare={lists.onCompare}
                    mine={lists.mine}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={onOthers} disabled={loading} className={`mt-8 ${primary}`}>
            Show me three others
          </button>
        </>
      )}

      {status === 'followup' && followup && (
        <Note
          pills
          actions={followup.options.map((o) => (
            <button key={o} type="button" onClick={() => onAnswer(followup.slot, o)} className={chip}>
              {o}
            </button>
          ))}
        >
          {followup.question}
        </Note>
      )}

      {status === 'nomatch' && (
        <Note
          actions={
            noMatch ? (
              <button type="button" onClick={() => onLoosen(noMatch.constraint)} className={primary}>
                Try without “{noMatch.label}”
              </button>
            ) : (
              <button type="button" onClick={onChangeMood} className={primary}>
                Change my mood
              </button>
            )
          }
        >
          {noMatch
            ? `Nothing in our notes fits all of that. The tightest part is “${noMatch.label}”.`
            : 'Nothing in our notes fits all of that yet.'}
        </Note>
      )}

      {status === 'error' && (
        <Note
          actions={
            <button type="button" onClick={onRetry} className={primary}>
              Try again
            </button>
          }
        >
          {ERRORS[error] || ERRORS.failed}
        </Note>
      )}
    </main>
  )
}
