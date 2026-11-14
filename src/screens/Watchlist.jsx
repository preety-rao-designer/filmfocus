import { Actions, Facts } from '../components/TitleParts.jsx'
import { posterUrl, primary } from '../ui.js'

// S4, Watchlist (V2): titles saved from anywhere, newest first. Each row is the poster (tap for its page), the title,
// facts and honest read, and the same actions as everywhere else; "On your watchlist" takes a title off, and taking
// the last one off shows the empty state.

export default function Watchlist({ list, lists, onOpen, onFind }) {
  return (
    <main className="mx-auto max-w-page px-4 pt-12 pb-16 md:px-12 md:pt-16">
      <h1 className="text-headline font-medium md:text-headline-lg">
        Your <span className="font-normal">watchlist</span>
      </h1>
      {list.length === 0 ? (
        <div role="status">
          <p className="mt-4 max-w-read text-lead text-muted">Nothing saved yet. Tap “Add to watchlist” on any title and it waits here for you.</p>
          <button type="button" onClick={onFind} className={`mt-8 ${primary}`}>
            Find something
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-lead text-muted">
            {list.length === 1 ? 'One title' : `${list.length} titles`} saved in this browser only.
          </p>
          <ul className="mt-8">
            {list.map((c) => (
              <li key={c.id} className="border-t border-line py-6">
                <div className="flex gap-4 md:gap-8">
                  <button type="button" onClick={() => onOpen(c)} aria-label={`${c.title}, see its page`} className="w-[88px] shrink-0 md:w-[140px]">
                    <span className="block aspect-[2/3] rounded-poster bg-night-raised bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl(c)})` }} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lead font-medium md:text-[28px] md:leading-tight">
                      <button type="button" onClick={() => onOpen(c)} className="text-left hover:underline">{c.title}</button>
                    </h2>
                    <Facts card={c} />
                    <p className="mt-3 max-w-read text-muted md:text-lead md:text-paper">{c.honest_read.actually_is}</p>
                  </div>
                </div>
                {/* Under the row on phones, so the buttons get the full width; under the text on desktop. */}
                <div className="md:pl-[172px]">
                  <Actions card={c} lists={lists} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
