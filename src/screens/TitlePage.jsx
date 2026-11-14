import { useEffect, useState } from 'react'
import Backdrop from '../components/Backdrop.jsx'
import { Actions, Aside, Details, Facts, HonestRead, Lists, TRUTH } from '../components/TitleParts.jsx'
import { backdropUrl, btn, quiet, titleSize } from '../ui.js'

// A title's own page (V2), at /title/<id>: opened from a shelf poster, a focused pick, the watchlist or compare. The
// backdrop, title, facts, honest read, truth note and actions; below, the details and the three lists the results
// screen has no room for. A card already on screen is passed in; otherwise (the shelf, a reload) it's fetched.

export default function TitlePage({ id, known, lists, onBack, onFind }) {
  const [state, setState] = useState(() => (known ? { status: 'ready', card: known } : { status: 'loading' }))

  useEffect(() => {
    if (known?.id === id) return setState({ status: 'ready', card: known })
    setState({ status: 'loading' })
    const ctrl = new AbortController()
    fetch(`/api/title?id=${encodeURIComponent(id)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((b) => setState({ status: 'ready', card: b.card }))
      .catch((e) => e?.name !== 'AbortError' && setState({ status: 'error', missing: e === 404 }))
    return () => ctrl.abort()
  }, [id])

  const back = (
    <button type="button" onClick={onBack} className={`${quiet} text-caption`}>
      ← Back
    </button>
  )

  if (state.status !== 'ready') {
    return (
      <main className="mx-auto max-w-page px-4 pt-[96px] pb-16 md:px-12 md:pt-[120px]">
        {back}
        <p role="status" className="mt-8 max-w-read text-read">
          {state.status === 'loading'
            ? 'Opening its card…'
            : state.missing
              ? "We don't have a card for that title."
              : "Couldn't reach our film notes. Try again in a moment."}
        </p>
        {state.status === 'error' && (
          <button type="button" onClick={onFind} className={`mt-6 ${btn}`}>
            Find something else
          </button>
        )}
      </main>
    )
  }

  const c = state.card
  return (
    <main>
      <section aria-label={c.title} className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden">
        <Backdrop url={backdropUrl(c)} />
        <div className="relative mx-auto w-full max-w-page px-4 pt-[22vh] pb-8 md:px-12 md:pt-[120px] md:pb-12">
          <div className="mb-3">{back}</div>
          <h1 className={`max-w-[1000px] ${titleSize(c.title)} font-medium [text-wrap:balance]`}>{c.title}</h1>
          <div className="max-w-[640px]">
            <Facts card={c} />
            <HonestRead card={c} />
            {c.truth.note && <Aside>{TRUTH[c.truth.status]} {c.truth.note}</Aside>}
            <Actions card={c} lists={lists} />
          </div>
        </div>
      </section>
      <section aria-label={`More about ${c.title}`} className="mx-auto max-w-page px-4 pt-2 pb-16 md:px-12 md:pt-6">
        <Details card={c} lists={lists} />
        <Lists card={c} />
      </section>
    </main>
  )
}
