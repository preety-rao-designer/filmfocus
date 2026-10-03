import { useEffect, useState } from 'react'
import FilmCard from '../components/FilmCard.jsx'
import { cardFor } from '../engine/live.js'
import { track } from '../track.js'
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

const MADE_ERRORS = {
  not_found: "We couldn't find that title. Check the spelling and try it in a new search.",
  limit: "We've made all the new cards we can today. Try again tomorrow.",
  busy: 'Lots of people are choosing right now. Try again in a moment.',
  failed: "We couldn't write an honest card for it from what's out there yet.",
  offline: 'You seem to be offline. Check your connection, then try again.',
}

// Launch L4: they named a title we don't have. Offer to make its card; meanwhile the Loading ticket, then the card,
// which is saved for everyone. One offer per search (the key resets it).
function OnDemand({ title, lists }) {
  const [state, setState] = useState({ status: 'offer' })
  useEffect(() => {
    if (state.status !== 'making') return
    const ctrl = new AbortController()
    cardFor(title, ctrl.signal)
      .then((r) => setState(r.card ? { status: 'made', card: r.card } : { status: 'error', error: r.error }))
      .catch(() => {})
    return () => ctrl.abort()
  }, [state.status, title])

  if (state.status === 'offer' || state.status === 'error')
    return (
      <Note
        actions={
          state.status === 'offer' && (
            <button
              type="button"
              onClick={() => {
                track('make_card', {}, lists.searchId())
                setState({ status: 'making' })
              }}
              className={primary}
            >
              Make its card
            </button>
          )
        }
      >
        {state.status === 'offer'
          ? `We don’t have a card for “${title}” yet. Making one takes about half a minute.`
          : MADE_ERRORS[state.error] || MADE_ERRORS.failed}
      </Note>
    )
  return (
    <div className="py-8">
      {/* Its own heading, so it doesn't read as a fourth pick. */}
      <h2 className="mb-6 text-section [text-wrap:balance]">The card for “{title}”</h2>
      <p className="sr-only" role="status">{state.status === 'making' ? `Making the card for ${title}…` : `The card for ${state.card.title} is here.`}</p>
      {state.status === 'making' ? (
        <FilmCard loading tint="rose" />
      ) : (
        <FilmCard
          card={state.card}
          tint="rose"
          saved={lists.savedIds.includes(state.card.id)}
          onSave={lists.onSave}
          comparing={lists.compareIds.includes(state.card.id)}
          compareFull={lists.compareFull}
          onCompare={lists.onCompare}
          mine={lists.mine}
          onWatch={lists.onWatch}
        />
      )}
    </div>
  )
}

export default function Results({ text, chips, view, batch, onOthers, onChangeMood, onRetry, onAnswer, onLoosen, lists }) {
  const { status, picks = [], followup, noMatch, error, missingTitle } = view
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
                    onWatch={lists.onWatch}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={onOthers} disabled={loading} className={`mt-8 ${primary}`}>
            Show me three others
          </button>
          {status === 'ready' && missingTitle && <OnDemand key={`${batch}-${missingTitle}`} title={missingTitle} lists={lists} />}
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
