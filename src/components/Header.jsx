// The Curtain header band (docs/DESIGN_DIRECTION.md palette: "Curtain … header band"). The wordmark is UI text, so Mukta.
// The 2px Curtain-deep rule along the bottom is the counter-window slot the result tickets come through (Motion).
// The three places you go back to sit on the right as caption links; the counts say what's waiting there.
const navLink = 'min-h-[44px] text-caption text-screen underline decoration-1 underline-offset-4'

export default function Header({ onHome, onPrefs, onWatchlist, onCompare, saved = 0, comparing = 0 }) {
  return (
    <header className="border-b-2 border-curtain-deep bg-curtain">
      <div className="mx-auto flex max-w-column flex-wrap items-center justify-between gap-x-6 px-4 py-4">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onHome()
          }}
          className="text-lead font-bold text-screen"
        >
          FilmFocus
        </a>
        <nav aria-label="Your lists" className="flex flex-wrap gap-x-4">
          <button type="button" onClick={onWatchlist} className={`${navLink} tabular`}>
            Watchlist{saved ? ` ${saved}` : ''}
          </button>
          {comparing > 0 && (
            <button type="button" onClick={onCompare} className={`${navLink} tabular`}>
              Compare {comparing}
            </button>
          )}
          <button type="button" onClick={onPrefs} className={navLink}>
            What I watch on
          </button>
        </nav>
      </div>
    </header>
  )
}
