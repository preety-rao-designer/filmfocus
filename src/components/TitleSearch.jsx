import { useEffect, useRef, useState } from 'react'
import { cardFor } from '../engine/live.js'
import { MADE_ERRORS } from '../screens/Results.jsx'
import { track } from '../track.js'
import { posterUrl, primary, quiet } from '../ui.js'

// Header search (V2): for people who already have a title in mind. A full-screen Night panel with one big field;
// matches from the store appear as you type (api/search.js, no model call) and open the title's page. Up/Down move
// through them, Enter opens, Esc closes. A title we don't have can have its card made here (Launch L4, api/card.js).
// Only the query's length is sent to analytics, never the text.

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 20 20" />
    </svg>
  )
}

export default function TitleSearch({ onOpen, onClose }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [exact, setExact] = useState(false)
  const [searched, setSearched] = useState('')
  const [active, setActive] = useState(0)
  const [made, setMade] = useState({ status: 'idle' })
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  // Ask as they type, a beat after they pause; a newer query cancels the older one.
  useEffect(() => {
    setMade({ status: 'idle' })
    const term = q.trim()
    if (term.length < 2) {
      setItems([])
      setSearched('')
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((b) => {
          setItems(b.items || [])
          setExact(!!b.exact)
          setSearched(term)
          setActive(0)
        })
        .catch(() => {})
    }, 150)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  const open = (item) => {
    track('find_title', { chars: q.trim().length, found: items.length })
    onOpen(item)
  }

  const make = async () => {
    const term = q.trim()
    track('make_card', { from: 'search' })
    setMade({ status: 'making' })
    const r = await cardFor(term).catch(() => ({ error: 'failed' }))
    if (r.card) onOpen(r.card)
    else setMade({ status: 'error', error: r.error })
  }

  const none = searched && searched === q.trim() && items.length === 0
  // Close matches but not the name they typed ("Lagaan" finds Dum Laga Ke Haisha): still let them make its card.
  const notIt = searched && searched === q.trim() && searched.length >= 4 && items.length > 0 && !exact
  return (
    <div role="dialog" aria-modal="true" aria-label="Search for a title" className="fixed inset-0 z-20 overflow-y-auto bg-night">
      <div className="mx-auto max-w-page px-4 pt-4 pb-16 md:px-12 md:pt-8">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={`${quiet} text-caption`}>
            Close
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (items[active]) open(items[active])
            else if (none && made.status === 'idle') make()
          }}
          className="mt-4 flex items-center gap-4 border-b border-line pb-4"
        >
          <span className="text-muted"><SearchIcon /></span>
          <input
            ref={input}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, items.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              }
            }}
            placeholder="Search a movie or show"
            aria-label="Search a movie or show"
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `found-${items[active].id}` : undefined}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-title font-medium text-paper outline-none placeholder:font-thin placeholder:text-muted md:text-title-lg"
          />
        </form>

        <p className="sr-only" role="status">
          {searched ? (items.length ? `${items.length} titles found` : 'No titles found') : ''}
        </p>
        <ul id="search-results" role="listbox" aria-label="Titles" className="mt-2">
          {items.map((it, i) => (
            <li key={it.id} id={`found-${it.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => open(it)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-4 rounded-poster px-2 py-3 text-left ${i === active ? 'bg-paper/5' : ''}`}
              >
                <span className="block w-[48px] shrink-0">
                  <span className="block aspect-[2/3] rounded-poster bg-night-raised bg-cover bg-center" style={posterUrl(it, 'w92') ? { backgroundImage: `url(${posterUrl(it, 'w92')})` } : undefined} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lead font-medium">{it.title}</span>
                  <span className="block truncate text-caption text-muted tabular">
                    {it.type === 'series' ? 'Series' : 'Movie'} · {it.year}
                    {it.original_title && it.original_title !== it.title ? ` · ${it.original_title}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {notIt && (
          <div className="mt-6 max-w-read">
            {made.status === 'error' ? (
              <p className="text-muted">{MADE_ERRORS[made.error] || MADE_ERRORS.failed}</p>
            ) : (
              <button type="button" onClick={make} disabled={made.status === 'making'} className={`${quiet} text-left`}>
                {made.status === 'making' ? 'Making its card…' : `Not the one you meant? Make a card for “${searched}”`}
              </button>
            )}
          </div>
        )}
        {none && (
          <div className="mt-8 max-w-read">
            <p className="text-read">
              {made.status === 'error'
                ? MADE_ERRORS[made.error] || MADE_ERRORS.failed
                : `We don’t have a card for “${searched}” yet. Making one takes about half a minute.`}
            </p>
            {made.status !== 'error' && (
              <button type="button" onClick={make} disabled={made.status === 'making'} className={`mt-6 ${primary}`}>
                {made.status === 'making' ? 'Making its card…' : 'Make its card'}
              </button>
            )}
          </div>
        )}
        {!searched && (
          <p className="mt-8 text-muted">Type the name of a movie or show, in English or its own language.</p>
        )}
      </div>
    </div>
  )
}
