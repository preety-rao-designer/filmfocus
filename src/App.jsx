import { useEffect, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import MoodInput from './screens/MoodInput.jsx'
import Results from './screens/Results.jsx'
import Preferences from './screens/Preferences.jsx'
import Watchlist from './screens/Watchlist.jsx'
import Compare from './screens/Compare.jsx'
import TitlePage from './screens/TitlePage.jsx'
import TitleSearch from './components/TitleSearch.jsx'
import { recommend } from './engine/live.js'
import { loadPrefs, savePrefs } from './prefs.js'
import { COMPARE_MAX, loadList, saveList, toggleCard } from './lists.js'
import { newSearchId, rememberChosen, track, trackVisit } from './track.js'
import MatchCheck from './components/MatchCheck.jsx'

// Six screens, no router: the path picks the screen (`/` is S1, `/results?…` is S2, `/watchlist` is S4, `/compare` is
// S5, `/preferences` is S6, `/title/<id>` is a title's own page). The query lives in the URL so S2 survives a reload
// and the back button works. All state lives here and is passed down.

const NO_CHIPS = { company: null, time: null, stay_or_shift: null }

function readUrl() {
  const p = new URLSearchParams(window.location.search)
  const path = window.location.pathname
  const title = path.match(/^\/title\/(tmdb-(?:movie|tv)-\d+)$/)
  return {
    screen: title ? 'title' : { '/results': 'results', '/preferences': 'prefs', '/watchlist': 'watchlist', '/compare': 'compare' }[path] || 'input',
    titleId: title?.[1] || null,
    text: p.get('q') || '',
    chips: { company: p.get('company'), time: p.get('time'), stay_or_shift: p.get('shift') },
  }
}

function resultsUrl(text, chips) {
  const p = new URLSearchParams()
  if (text.trim()) p.set('q', text.trim())
  if (chips.company) p.set('company', chips.company)
  if (chips.time) p.set('time', chips.time)
  if (chips.stay_or_shift) p.set('shift', chips.stay_or_shift)
  const qs = p.toString()
  return `/results${qs ? `?${qs}` : ''}`
}

export default function App() {
  const [initial] = useState(readUrl)
  const [screen, setScreen] = useState(initial.screen)
  const [text, setText] = useState(initial.text)
  const [chips, setChips] = useState({ ...NO_CHIPS, ...initial.chips })
  const [prefs, setPrefs] = useState(loadPrefs)
  const [view, setView] = useState({ status: 'loading' })
  const [batch, setBatch] = useState(0)
  const [watchlist, setWatchlist] = useState(() => loadList('watchlist'))
  const [compare, setCompare] = useState(() => loadList('compare'))
  const [titleId, setTitleId] = useState(initial.titleId)
  const [searching, setSearching] = useState(false)
  const known = useRef({}) // cards already on screen, so a title's page opens without asking the server again
  const seen = useRef([])
  const last = useRef(null) // the last request, so "Try again" repeats exactly it
  const inflight = useRef(null)
  const pendingFind = useRef(null) // a search waiting on first-run preferences
  const prefsRef = useRef(prefs) // read at request time, so a search right after saving uses the new prefs
  const searchId = useRef(null) // ties opens and saves to the search they came from (L6)

  // One request at a time: a new tap cancels the one in flight, so rapid taps can't land out of order.
  const run = async (req) => {
    inflight.current?.abort()
    const ctrl = new AbortController()
    inflight.current = ctrl
    last.current = req
    setView({ status: 'loading' })
    setBatch((b) => b + 1)
    window.scrollTo(0, 0)
    try {
      const res = await recommend({ ...req, prefs: prefsRef.current || {}, exclude: seen.current, signal: ctrl.signal })
      if (ctrl.signal.aborted) return
      if (res.followup) return setView({ status: 'followup', followup: res.followup })
      if (!res.picks.length) return setView({ status: 'nomatch', noMatch: res.no_match })
      const ids = res.picks.map((p) => p.card.id)
      for (const p of res.picks) known.current[p.card.id] = p.card
      // When the engine starts a new cycle, the seen list starts again too.
      seen.current = ids.some((id) => seen.current.includes(id)) ? ids : [...seen.current, ...ids]
      setView({ status: 'ready', picks: res.picks, missingTitle: res.missing_title || null, dubbedIn: res.dubbed_in || null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setView({ status: 'error', error: e.kind || 'failed' })
    }
  }

  const startSearch = (t, c) => {
    cameFromTitle.current = false
    seen.current = []
    searchId.current = newSearchId()
    track('search', { chars: t.trim().length, chips: Object.values(c).filter(Boolean).length, surprise: !t.trim() && !Object.values(c).some(Boolean) }, searchId.current)
    window.history.pushState(null, '', resultsUrl(t, c))
    setScreen('results')
    run({ text: t, chips: c })
  }

  // First run: ask for preferences once, then carry on with the search they started.
  const find = (t, c) => {
    if (!prefs) {
      pendingFind.current = [t, c]
      window.history.pushState(null, '', '/preferences')
      setScreen('prefs')
      return
    }
    startSearch(t, c)
  }

  useEffect(() => {
    trackVisit()
    if (initial.screen === 'results') {
      searchId.current = newSearchId()
      run({ text: initial.text, chips: { ...NO_CHIPS, ...initial.chips } })
    }
    const onPop = () => {
      const u = readUrl()
      setScreen(u.screen)
      setTitleId(u.titleId)
      setText(u.text)
      setChips({ ...NO_CHIPS, ...u.chips })
      // Back to results from a title's page keeps the same three; anything else asks again.
      if (u.screen === 'results' && cameFromTitle.current && last.current) {
        cameFromTitle.current = false
      } else if (u.screen === 'results') {
        seen.current = []
        searchId.current = newSearchId()
        run({ text: u.text, chips: { ...NO_CHIPS, ...u.chips } })
      } else inflight.current?.abort()
    }
    window.addEventListener('popstate', onPop)
    // "/" opens title search from anywhere, unless they're typing.
    const onSlash = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.target.closest?.('input, textarea')) return
      e.preventDefault()
      setSearching(true)
    }
    window.addEventListener('keydown', onSlash)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onSlash)
    }
  }, [])

  const cameFromTitle = useRef(false)
  // A title's page: from a shelf poster (light item), a pick, the watchlist or compare.
  const openTitle = (item) => {
    if (item.honest_read) known.current[item.id] = item
    cameFromTitle.current = screen === 'results'
    track('open_title', { card: item.id, from: screen }, searchId.current)
    go(`/title/${item.id}`, 'title')
    setTitleId(item.id)
  }
  const back = () => (window.history.length > 1 ? window.history.back() : toInput())

  const toInput = () => {
    inflight.current?.abort()
    window.history.pushState(null, '', '/')
    setScreen('input')
    window.scrollTo(0, 0)
  }
  const toPrefs = () => {
    pendingFind.current = null
    window.history.pushState(null, '', '/preferences')
    setScreen('prefs')
    window.scrollTo(0, 0)
  }
  const go = (path, name) => {
    inflight.current?.abort()
    window.history.pushState(null, '', path)
    setScreen(name)
    window.scrollTo(0, 0)
  }
  // Side effects (storage, events) sit outside the state setters: React may run a setter twice in development.
  const toggleSaved = (card) => {
    const next = toggleCard(watchlist, card)
    known.current[card.id] = card
    if (next.length > watchlist.length) {
      rememberChosen(card)
      track('save', { card: card.id }, searchId.current)
    }
    saveList('watchlist', next)
    setWatchlist(next)
  }
  const toggleCompare = (card) => {
    const next = toggleCard(compare, card, COMPARE_MAX)
    if (next.length > compare.length) track('compare', { card: card.id }, searchId.current)
    saveList('compare', next)
    setCompare(next)
  }
  const clearCompare = () => {
    saveList('compare', [])
    setCompare([])
  }
  const cardLists = {
    savedIds: watchlist.map((c) => c.id),
    compareIds: compare.map((c) => c.id),
    compareFull: compare.length >= COMPARE_MAX,
    onSave: toggleSaved,
    onCompare: toggleCompare,
    mine: prefs?.platforms || [],
    // Tapping a service is the strongest "I'm watching this" signal we get.
    onWatch: (card, platform) => {
      rememberChosen(card)
      track('open', { card: card.id, platform }, searchId.current)
    },
    searchId: () => searchId.current,
  }

  const closePrefs = (saved) => {
    if (saved) {
      savePrefs(saved)
      prefsRef.current = saved
      setPrefs(saved)
    }
    const pending = pendingFind.current
    pendingFind.current = null
    if (pending) startSearch(...pending)
    else window.history.back()
  }

  // Over a backdrop (results with picks or loading, a title's page) the header floats on the image.
  const overlay = screen === 'title' || (screen === 'results' && ['loading', 'ready'].includes(view.status))

  return (
    <>
      <Header
        overlay={overlay}
        onSearch={() => setSearching(true)}
        onHome={toInput}
        onPrefs={toPrefs}
        onWatchlist={() => go('/watchlist', 'watchlist')}
        onCompare={() => go('/compare', 'compare')}
        saved={watchlist.length}
        comparing={compare.length}
      />
      {screen === 'watchlist' && (
        <Watchlist list={watchlist} lists={cardLists} onOpen={openTitle} onFind={toInput} />
      )}
      {screen === 'compare' && <Compare list={compare} onRemove={toggleCompare} onClear={clearCompare} onFind={toInput} onOpen={openTitle} />}
      {screen === 'title' && titleId && (
        <TitlePage
          key={titleId}
          id={titleId}
          known={known.current[titleId] || watchlist.find((c) => c.id === titleId) || compare.find((c) => c.id === titleId)}
          lists={cardLists}
          onBack={back}
          onFind={toInput}
        />
      )}
      {screen === 'prefs' && (
        <Preferences
          initial={prefs}
          firstRun={!prefs}
          onSave={(p) => closePrefs(p)}
          // Skipping still counts as answered, so we don't ask again.
          onSkip={() => closePrefs(prefs || { platforms: [], languages: [], subtitles_ok: false, skipped: true })}
        />
      )}
      {screen === 'input' && (
        <MoodInput
          text={text}
          chips={chips}
          onText={setText}
          onChip={(key, value) => setChips((c) => ({ ...c, [key]: value }))}
          onFind={() => find(text, chips)}
          onSurprise={() => {
            // Surprise me ignores what's typed: no mood, no chips, any three that fit saved preferences.
            setText('')
            setChips(NO_CHIPS)
            find('', NO_CHIPS)
          }}
          onOpen={openTitle}
        >
          <MatchCheck />
        </MoodInput>
      )}
      {screen === 'results' && (
        <Results
          text={text}
          chips={chips}
          view={view}
          batch={batch}
          // Same request again (keeping any follow-up answer or loosened constraint); `seen` moves it on.
          onOthers={() => {
            track('others', {}, searchId.current)
            run(last.current)
          }}
          onChangeMood={toInput}
          onRetry={() => run(last.current)}
          onAnswer={(slot, value) => {
            track('answer', { value }, searchId.current)
            run({ text, chips, answer: { slot, value } })
          }}
          onLoosen={(key) => {
            track('loosen', { key }, searchId.current)
            run({ text, chips, loosen: [...(last.current?.loosen || []), key] })
          }}
          lists={cardLists}
          onOpen={openTitle}
        />
      )}
      <Footer />
      {searching && (
        <TitleSearch
          onClose={() => setSearching(false)}
          onOpen={(item) => {
            setSearching(false)
            openTitle(item)
          }}
        />
      )}
    </>
  )
}
