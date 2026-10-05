// The header (docs/DESIGN_DIRECTION.md V2): the wordmark on the left, the places you go back to on the right. Over a
// backdrop (results, a title's page) it floats on the image; elsewhere it sits on Night. Counts say what's waiting.
// The search icon opens title search, for people who already have a title in mind.
import { SearchIcon } from './TitleSearch.jsx'

const navLink = 'min-h-[44px] text-caption text-muted hover:text-paper'

export default function Header({ onHome, onPrefs, onWatchlist, onCompare, onSearch, saved = 0, comparing = 0, overlay = false }) {
  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-10' : 'relative'}>
      <div className="mx-auto flex min-h-[64px] max-w-page flex-wrap items-center justify-between gap-x-6 px-4 md:px-12">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onHome()
          }}
          className="text-body font-bold tracking-tight text-paper"
        >
          Film<span className="text-amber">Focus</span>
        </a>
        <nav aria-label="Your lists" className="flex flex-wrap items-center gap-x-5">
          <button type="button" onClick={onSearch} aria-label="Search for a title" className="-mx-3 inline-flex h-[44px] w-[44px] items-center justify-center text-muted hover:text-paper">
            <SearchIcon />
          </button>
          <button type="button" onClick={onWatchlist} className={`${navLink} tabular`}>
            Watchlist{saved ? <span className="ml-1 text-amber">{saved}</span> : ''}
          </button>
          {comparing > 0 && (
            <button type="button" onClick={onCompare} className={`${navLink} tabular`}>
              Compare<span className="ml-1 text-amber">{comparing}</span>
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
