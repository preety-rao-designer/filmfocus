import { useEffect, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import MoodInput from './screens/MoodInput.jsx'
import Results from './screens/Results.jsx'
import Preferences from './screens/Preferences.jsx'
import Watchlist from './screens/Watchlist.jsx'
import Compare from './screens/Compare.jsx'
import { recommend } from './engine/live.js'
import { loadPrefs, savePrefs } from './prefs.js'
import { COMPARE_MAX, loadList, saveList, toggleCard } from './lists.js'

// Five screens, no router: the path picks the screen (`/` is S1, `/results?…` is S2, `/watchlist` is S4, `/compare` is
// S5, `/preferences` is S6). The
// query lives in the URL so S2 survives a reload and the back button works. All state lives here and is passed down.

const NO_CHIPS = { company: null, time: null, stay_or_shift: null }

function readUrl() {
  const p = new URLSearchParams(window.location.search)
  const path = window.location.pathname
  return {
    screen: { '/results': 'results', '/preferences': 'prefs', '/watchlist': 'watchlist', '/compare': 'compare' }[path] || 'input',
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
  const seen = useRef([])
  const last = useRef(null) // the last request, so "Try again" repeats exactly it
  const inflight = useRef(null)
  const pendingFind = useRef(null) // a search waiting on first-run preferences
  const prefsRef = useRef(prefs) // read at request time, so a search right after saving uses the new prefs

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
      // When the engine starts a new cycle, the seen list starts again too.
      seen.current = ids.some((id) => seen.current.includes(id)) ? ids : [...seen.current, ...ids]
      setView({ status: 'ready', picks: res.picks, missingTitle: res.missing_title || null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setView({ status: 'error', error: e.kind || 'failed' })
    }
  }

  const startSearch = (t, c) => {
    seen.current = []
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
    if (initial.screen === 'results') run({ text: initial.text, chips: { ...NO_CHIPS, ...initial.chips } })
    const onPop = () => {
      const u = readUrl()
      setScreen(u.screen)
      setText(u.text)
      setChips({ ...NO_CHIPS, ...u.chips })
      if (u.screen === 'results') {
        seen.current = []
        run({ text: u.text, chips: { ...NO_CHIPS, ...u.chips } })
      } else inflight.current?.abort()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
  const toggleSaved = (card) => setWatchlist((l) => {
    const next = toggleCard(l, card)
    saveList('watchlist', next)
    return next
  })
  const toggleCompare = (card) => setCompare((l) => {
    const next = toggleCard(l, card, COMPARE_MAX)
    saveList('compare', next)
    return next
  })
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

  return (
    <>
      <Header
        onHome={toInput}
        onPrefs={toPrefs}
        onWatchlist={() => go('/watchlist', 'watchlist')}
        onCompare={() => go('/compare', 'compare')}
        saved={watchlist.length}
        comparing={compare.length}
      />
      {screen === 'watchlist' && (
        <Watchlist
          list={watchlist}
          compareIds={cardLists.compareIds}
          compareFull={cardLists.compareFull}
          mine={cardLists.mine}
          onSave={toggleSaved}
          onCompare={toggleCompare}
          onFind={toInput}
        />
      )}
      {screen === 'compare' && <Compare list={compare} onRemove={toggleCompare} onClear={clearCompare} onFind={toInput} />}
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
        />
      )}
      {screen === 'results' && (
        <Results
          text={text}
          chips={chips}
          view={view}
          batch={batch}
          // Same request again (keeping any follow-up answer or loosened constraint); `seen` moves it on.
          onOthers={() => run(last.current)}
          onChangeMood={toInput}
          onRetry={() => run(last.current)}
          onAnswer={(slot, value) => run({ text, chips, answer: { slot, value } })}
          onLoosen={(key) => run({ text, chips, loosen: [...(last.current?.loosen || []), key] })}
          lists={cardLists}
        />
      )}
      <Footer />
    </>
  )
}
