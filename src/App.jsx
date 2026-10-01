import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import MoodInput from './screens/MoodInput.jsx'
import Results from './screens/Results.jsx'
import { catalogue } from './mocks/catalogue.js'

// Two screens, no router: the path picks the screen (`/` is S1, `/results` is S2) and history.pushState keeps
// the browser's back button working. All state lives here and is passed down.

const screenFromPath = () => (window.location.pathname === '/results' ? 'results' : 'input')
const NO_CHIPS = { company: null, time: null, stay_or_shift: null }

export default function App() {
  const [screen, setScreen] = useState(screenFromPath)
  const [text, setText] = useState('')
  const [chips, setChips] = useState(NO_CHIPS)

  useEffect(() => {
    const onPop = () => setScreen(screenFromPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = (next) => {
    const path = next === 'results' ? '/results' : '/'
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  // Shell only: S2 shows the first three cards until the mock engine is wired in (step 2.7).
  const picks = catalogue.slice(0, 3).map((card) => ({ card, why_this_fits: 'Placeholder until the mock engine is wired in.' }))

  return (
    <>
      <Header onHome={() => go('input')} />
      {screen === 'input' ? (
        <MoodInput
          text={text}
          chips={chips}
          onText={setText}
          onChip={(key, value) => setChips((c) => ({ ...c, [key]: value }))}
          onFind={() => go('results')}
          onSurprise={() => go('results')}
        />
      ) : (
        <Results text={text} chips={chips} picks={picks} onOthers={() => {}} onChangeMood={() => go('input')} />
      )}
    </>
  )
}
