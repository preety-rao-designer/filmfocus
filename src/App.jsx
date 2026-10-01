import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import MoodInput from './screens/MoodInput.jsx'
import Results from './screens/Results.jsx'
import { recommend } from './engine/mock.js'

// Two screens, no router: the path picks the screen (`/` is S1, `/results?…` is S2). The query lives in the URL so
// S2 survives a reload and the back button works. All state lives here and is passed down.

const NO_CHIPS = { company: null, time: null, stay_or_shift: null }

function readUrl() {
  const p = new URLSearchParams(window.location.search)
  return {
    screen: window.location.pathname === '/results' ? 'results' : 'input',
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
  const [picks, setPicks] = useState([])
  const [seen, setSeen] = useState([])

  const run = async (t, c, exclude) => {
    const res = await recommend({ text: t, chips: c, exclude })
    setPicks(res.picks)
    const ids = res.picks.map((p) => p.card.id)
    // When the engine starts a new cycle, the seen list starts again too.
    setSeen(ids.some((id) => exclude.includes(id)) ? ids : [...exclude, ...ids])
    window.scrollTo(0, 0)
  }

  // Arriving on /results directly, or via back/forward: run the query in the URL.
  useEffect(() => {
    if (initial.screen === 'results') run(initial.text, { ...NO_CHIPS, ...initial.chips }, [])
    const onPop = () => {
      const u = readUrl()
      setScreen(u.screen)
      setText(u.text)
      setChips({ ...NO_CHIPS, ...u.chips })
      if (u.screen === 'results') run(u.text, { ...NO_CHIPS, ...u.chips }, [])
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const find = async (t, c) => {
    window.history.pushState(null, '', resultsUrl(t, c))
    await run(t, c, [])
    setScreen('results')
  }

  const toInput = () => {
    window.history.pushState(null, '', '/')
    setScreen('input')
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Header onHome={toInput} />
      {screen === 'input' ? (
        <MoodInput
          text={text}
          chips={chips}
          onText={setText}
          onChip={(key, value) => setChips((c) => ({ ...c, [key]: value }))}
          onFind={() => find(text, chips)}
          onSurprise={() => {
            // Surprise me ignores what's typed: no mood, no chips, any three.
            setText('')
            setChips(NO_CHIPS)
            find('', NO_CHIPS)
          }}
        />
      ) : (
        <Results text={text} chips={chips} picks={picks} onOthers={() => run(text, chips, seen)} onChangeMood={toInput} />
      )}
    </>
  )
}
