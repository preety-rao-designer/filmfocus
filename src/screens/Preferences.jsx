import { useState } from 'react'
import { LANGUAGES, PLATFORMS } from '../prefs.js'
import { chip } from './MoodInput.jsx'

// S6, Preferences: which services you have and which languages you watch in. Asked once before the first search,
// editable from the header. Same type, chips and Curtain pill as S1; nothing new.

export default function Preferences({ initial, firstRun, onSave, onSkip }) {
  const [platforms, setPlatforms] = useState(initial?.platforms || [])
  const [languages, setLanguages] = useState(initial?.languages || [])
  const [subtitlesOk, setSubtitlesOk] = useState(initial?.subtitles_ok || false)
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <form
      className="mx-auto max-w-column px-4 pt-12 pb-16 text-ink dark:text-screen md:pt-16"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ platforms, languages, subtitles_ok: subtitlesOk })
      }}
    >
      <h1 className="font-display text-headline [text-wrap:balance] md:text-headline-lg">
        {firstRun ? 'First, what do you watch on?' : 'What you watch on'}
      </h1>
      <p className="mt-4 text-lead">So your three are things you can press play on tonight. Saved in this browser only.</p>

      <div role="group" aria-labelledby="pref-platforms" className="mt-8">
        <p id="pref-platforms" className="text-caption">Services you have</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} type="button" aria-pressed={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)} className={chip}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-labelledby="pref-languages" className="mt-6">
        <p id="pref-languages" className="text-caption">Languages you watch in</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGES.map(([code, name]) => (
            <button key={code} type="button" aria-pressed={languages.includes(code)} onClick={() => toggle(languages, setLanguages, code)} className={chip}>
              {name}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <button type="button" aria-pressed={subtitlesOk} onClick={() => setSubtitlesOk((v) => !v)} className={chip}>
            Any language is fine with subtitles
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button type="submit" className="inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen">
          {firstRun ? 'Save and find my three' : 'Save'}
        </button>
        <button type="button" onClick={onSkip} className="min-h-[44px] text-body underline decoration-1 underline-offset-4">
          {firstRun ? 'Skip for now' : 'Cancel'}
        </button>
      </div>
    </form>
  )
}
