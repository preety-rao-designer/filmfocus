import { useEffect, useRef, useState } from 'react'
import Backdrop from '../components/Backdrop.jsx'
import { loadShelf } from '../components/Shelf.jsx'
import { Actions, Aside, Details, Facts, HonestRead } from '../components/TitleParts.jsx'
import { cardFor } from '../engine/live.js'
import { track } from '../track.js'
import { CHIP_GROUPS } from './MoodInput.jsx'
import { backdropUrl, btn, chip, posterUrl, primary, quiet, titleSize, two } from '../ui.js'

// S2, Results (V2, docs/DESIGN_DIRECTION.md "The Late Show"): one pick in focus at a time over its backdrop, with
// a big thin numeral, the title, the honest read, why it fits and the actions. All three posters sit beside it
// (above it on phones) so the three are always in view; tapping another poster moves the focus, tapping the focused
// one opens its page; ← → keys move it too. Regenerate, under the posters, brings three different picks. The details
// sit below the backdrop. In place of the picks, depending on what really happened:
// the loading state, the one follow-up question with pill answers, a "nothing fits" line with a one-tap way to
// loosen, or a plain error and retry.

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

// Placeholder for loading: a soft shimmering bar sitting in a real line of text, so line heights match and nothing jumps.
function Bar({ chars = 24 }) {
  return <span aria-hidden="true" className="shimmer inline-block h-[0.9em] max-w-full rounded-pill bg-paper/5 align-middle" style={{ width: `${chars}ch` }} />
}

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// While the engine works, the title's place says what it's doing, in the order the server does it (understand the
// mood, search the cards, rerank, write why each fits). Timed, not reported: it settles on the last line until the
// picks arrive. Under reduced motion it's one still line.
const PHRASES = ['Reading your mood…', 'Looking through our honest cards…', 'Weighing tone, pace and endings…', 'Picking your three…']
function LoadingLine() {
  const [n, setN] = useState(0)
  const [out, setOut] = useState(false)
  useEffect(() => {
    if (still() || n >= PHRASES.length - 1) return
    const t = setTimeout(() => {
      setOut(true)
      setTimeout(() => {
        setN((x) => x + 1)
        setOut(false)
      }, 300)
    }, 1800)
    return () => clearTimeout(t)
  }, [n])
  return (
    <h2 className={`phrase text-[24px] font-medium leading-tight tracking-tight md:text-[32px] ${out ? 'out' : ''}`}>
      {still() ? 'Finding your three…' : PHRASES[n]}
    </h2>
  )
}

// A loading poster slot: blurred posters from the shelf flick past, like reels being looked through. Blurred so
// they never read as picks. Each slot runs at its own pace.
function Reel({ i }) {
  const [list, setList] = useState([])
  const [n, setN] = useState(i * 5)
  useEffect(() => {
    let live = true
    loadShelf().then((l) => live && setList(l))
    return () => (live = false)
  }, [])
  useEffect(() => {
    if (!list.length || still()) return
    const t = setInterval(() => setN((x) => x + 1), 520 + i * 110)
    return () => clearInterval(t)
  }, [list, i])
  const item = list.length ? list[n % list.length] : null
  return (
    <span aria-hidden="true" className="shimmer absolute inset-0 overflow-hidden rounded-poster">
      {item && !still() && <span key={n} className="reel absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl(item, 'w185')})` }} />}
    </span>
  )
}

// In-place messages: one line, then the actions.
function Note({ children, actions, pills = false }) {
  return (
    <div role="status" className="py-8">
      <p className="max-w-read text-read [text-wrap:balance] md:text-read-lg">{children}</p>
      <div className={`mt-6 flex flex-wrap items-center ${pills ? 'gap-2' : 'gap-x-6 gap-y-4'}`}>{actions}</div>
    </div>
  )
}

export const MADE_ERRORS = {
  not_found: "We couldn't find that title. Check the spelling and try it in a new search.",
  limit: "We've made all the new cards we can today. Try again tomorrow.",
  busy: 'Lots of people are choosing right now. Try again in a moment.',
  failed: "We couldn't write an honest card for it from what's out there yet.",
  offline: 'You seem to be offline. Check your connection, then try again.',
}

// Launch L4: they named a title we don't have. Offer to make its card; once made it's saved for everyone and opens
// on its own page. One offer per search (the key resets it).
function OnDemand({ title, lists, onOpen }) {
  const [state, setState] = useState({ status: 'offer' })
  useEffect(() => {
    if (state.status !== 'making') return
    const ctrl = new AbortController()
    cardFor(title, ctrl.signal)
      .then((r) => setState(r.card ? { status: 'made', card: r.card } : { status: 'error', error: r.error }))
      .catch(() => {})
    return () => ctrl.abort()
  }, [state.status, title])

  if (state.status === 'made') {
    const c = state.card
    return (
      <div role="status" className="flex items-center gap-5 border-t border-line py-8">
        <button type="button" onClick={() => onOpen(c)} className="w-[96px] shrink-0" aria-label={`${c.title}, see its page`}>
          <span className="block aspect-[2/3] rounded-poster bg-night-raised bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl(c)})` }} />
        </button>
        <div className="min-w-0">
          <p className="text-caption text-muted">The card for “{title}” is ready</p>
          <p className="mt-1 text-lead font-medium">{c.title}</p>
          <p className="mt-1 text-muted">{c.honest_read.actually_is}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => onOpen(c)} className={btn}>See its page</button>
            <button type="button" aria-pressed={lists.savedIds.includes(c.id)} onClick={() => lists.onSave(c)} className={btn}>
              {lists.savedIds.includes(c.id) ? 'On your watchlist' : 'Add to watchlist'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="border-t border-line">
      <Note
        actions={
          state.status === 'offer' ? (
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
          ) : state.status === 'making' ? (
            <p className="text-muted">Reading what’s out there and writing it now…</p>
          ) : null
        }
      >
        {state.status === 'error'
          ? MADE_ERRORS[state.error] || MADE_ERRORS.failed
          : `We don’t have a card for “${title}” yet. Making one takes about half a minute.`}
      </Note>
    </div>
  )
}

function RefreshIcon({ spinning }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'spin' : ''}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  )
}

function Poster({ pick, i, current, loading, onClick }) {
  const c = pick?.card
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-current={current || undefined}
      aria-label={loading ? `Pick ${i + 1}, loading` : current ? `${c.title}, see its page` : `${two(i + 1)} ${c.title}`}
      className="group min-w-0 flex-1 text-left md:w-[168px] md:flex-none"
    >
      <span
        className={`lift relative block aspect-[2/3] rounded-poster bg-cover bg-center ${c ? 'bg-night-raised' : 'bg-paper/5'} ${
          current ? '-translate-y-[10px] ring-2 ring-amber' : c ? 'brightness-[.55] saturate-[.7] group-hover:brightness-[.85]' : ''
        }`}
        style={c ? { backgroundImage: `url(${posterUrl(c)})` } : undefined}
      >
        {!c && <Reel i={i} />}
      </span>
      <span className={`mt-[10px] flex items-baseline gap-2 text-caption ${current ? 'text-paper' : 'text-paper/70'}`}>
        <span className="text-[22px] font-thin leading-none text-paper tabular">{two(i + 1)}</span>
        <span className="truncate">{c ? c.title : <Bar chars={10} />}</span>
      </span>
    </button>
  )
}

export default function Results({ text, chips, view, batch, onOthers, onChangeMood, onRetry, onAnswer, onLoosen, lists, onOpen }) {
  const { status, picks = [], followup, noMatch, error, missingTitle, dubbedIn } = view
  const loading = status === 'loading'
  const [cur, setCur] = useState(0)
  const [shown, setShown] = useState(0)
  const [out, setOut] = useState(false)
  const timer = useRef(null)

  // A new set of picks starts on the first one.
  useEffect(() => {
    clearTimeout(timer.current)
    setCur(0)
    setShown(0)
    setOut(false)
  }, [batch])

  // Moving the focus: the text fades out, changes, and fades back in while the backdrop crossfades.
  const focusOn = (i) => {
    const n = (i + 3) % 3
    if (n === cur || !picks[n]) return
    setCur(n)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) return setShown(n)
    setOut(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setShown(n)
      setOut(false)
    }, 220)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (status !== 'ready') return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'ArrowRight') focusOn(cur + 1)
      if (e.key === 'ArrowLeft') focusOn(cur - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const forLine = (
    // Desktop: one line, a long request cut short, the link always in view. Phones: up to two lines, then the links
    // on their own row, with Regenerate beside "Change my mood" so it isn't left floating under the posters.
    <div className="flex max-w-[640px] flex-wrap items-baseline gap-x-6 text-caption text-muted md:flex-nowrap md:gap-x-4">
      <p className="line-clamp-2 w-full md:w-auto md:min-w-0 md:truncate" title={askedFor(text, chips)}>
        For <span className="text-paper/80">{askedFor(text, chips)}</span>
      </p>
      <button type="button" onClick={onChangeMood} className={`${quiet} shrink-0 text-caption`}>
        Change my mood
      </button>
      {(loading || status === 'ready') && (
        <button type="button" onClick={onOthers} disabled={loading} aria-label="Regenerate: show me three others" className={`${quiet} inline-flex shrink-0 items-center gap-1 text-caption md:hidden`}>
          <RefreshIcon spinning={loading} />
          {loading ? 'Finding…' : 'Regenerate'}
        </button>
      )}
    </div>
  )

  if (!loading && status !== 'ready') {
    return (
      <main className="mx-auto max-w-page px-4 pt-[96px] pb-16 md:px-12 md:pt-[120px]">
        <h1 className="sr-only">Your three picks</h1>
        {forLine}
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
          <Note actions={<button type="button" onClick={onRetry} className={primary}>Try again</button>}>
            {ERRORS[error] || ERRORS.failed}
          </Note>
        )}
      </main>
    )
  }

  const pick = loading ? null : picks[shown]
  const c = pick?.card
  return (
    <main>
      <h1 className="sr-only">Your three picks</h1>
      <p className="sr-only" role="status">{loading ? 'Finding your three…' : `Your three are here. Showing ${c?.title}.`}</p>
      <section aria-label={c ? `Pick ${shown + 1}: ${c.title}` : 'Your three'} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
        <Backdrop url={loading ? null : backdropUrl(picks[cur]?.card)} />
        {loading && (
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-[2px] overflow-hidden bg-paper/5">
            <div className="progress-run h-full w-2/5 bg-amber" />
          </div>
        )}
        <div className="relative mx-auto flex w-full max-w-page flex-col px-4 pt-[22vh] pb-8 md:grid md:grid-cols-[minmax(0,560px)_1fr] md:items-end md:gap-x-12 md:gap-y-0 md:px-12 md:pt-[120px] md:pb-12">
          <div className="order-1 mb-6 md:col-start-1 md:row-start-1 md:mb-8">
            {forLine}
            {/* We hold no dubbing data, so a dub request is said out loud rather than quietly ignored. */}
            {status === 'ready' && dubbedIn && (
              <p className="mt-2 max-w-read text-caption text-muted">
                We can’t check dubs yet, so these are picked on everything else. Look for {dubbedIn.join(' or ')} in the audio options on the service.
              </p>
            )}
          </div>

          <div className="order-2 mb-8 md:col-start-2 md:row-start-3 md:mb-0">
            <div className="flex items-end gap-3 md:justify-end md:gap-4">
              {[0, 1, 2].map((i) => (
                <Poster
                  key={i}
                  i={i}
                  pick={picks[i]}
                  loading={loading || !picks[i]}
                  current={!loading && i === cur}
                  onClick={() => (i === cur ? onOpen(picks[i].card) : focusOn(i))}
                />
              ))}
            </div>
            {/* Regenerate: three different picks for the same mood (the engine skips ones already shown). */}
            <div className="mt-4 hidden justify-end md:flex">
              <button type="button" onClick={onOthers} disabled={loading} aria-label="Regenerate: show me three others" className={`${btn} bg-night/60`}>
                <RefreshIcon spinning={loading} />
                {loading ? 'Finding…' : 'Regenerate'}
              </button>
            </div>
          </div>

          {/* The title row runs across the whole width, so long titles stay on one or two lines. */}
          <div className={`focus-swap order-3 md:col-span-2 md:col-start-1 md:row-start-2 ${out ? 'out' : ''}`}>
            <div className="flex items-start gap-4 md:gap-6">
              <span aria-hidden="true" className="text-num font-thin text-paper/40 tabular md:text-num-lg">{two(shown + 1)}</span>
              <div className="min-w-0 max-w-[1000px]">
                {c ? <h2 className={`${titleSize(c.title)} font-medium [text-wrap:balance]`}>{c.title}</h2> : <LoadingLine />}
                {c ? <Facts card={c} /> : <p className="mt-3 text-caption"><Bar chars={36} /></p>}
              </div>
            </div>
          </div>
          <div className={`focus-swap order-4 md:col-start-1 md:row-start-3 ${out ? 'out' : ''}`}>
            {c ? (
              <>
                <HonestRead card={c} />
                {pick.why_this_fits && <Aside>{pick.why_this_fits}</Aside>}
                <Actions card={c} lists={lists} />
                {/* The details sit under the fold; say so, and take them there. */}
                <div className="mt-4 flex flex-wrap gap-x-6">
                  <button
                    type="button"
                    onClick={() => document.getElementById('pick-details')?.scrollIntoView({ behavior: still() ? 'auto' : 'smooth' })}
                    className={`${quiet} text-caption`}
                  >
                    How it feels, tone and ending ↓
                  </button>
                  <button type="button" onClick={() => onOpen(c)} className={`${quiet} text-caption`}>
                    See the full page →
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6 grid gap-3" aria-hidden="true">
                <p className="text-caption"><Bar chars={36} /></p>
                <p className="text-read"><Bar chars={26} /> <Bar chars={18} /></p>
                <p className="mt-4"><Bar chars={30} /></p>
              </div>
            )}
          </div>
        </div>
      </section>

      {c && (
        <section id="pick-details" aria-label={`More about ${c.title}`} className={`focus-swap mx-auto scroll-mt-4 max-w-page px-4 pt-2 pb-8 md:px-12 md:pt-6 ${out ? 'out' : ''}`}>
          <Details card={c} lists={lists} />
        </section>
      )}

      <div className="mx-auto max-w-page px-4 pb-16 md:px-12">
        {status === 'ready' && missingTitle && <OnDemand key={`${batch}-${missingTitle}`} title={missingTitle} lists={lists} onOpen={onOpen} />}
      </div>
    </main>
  )
}
