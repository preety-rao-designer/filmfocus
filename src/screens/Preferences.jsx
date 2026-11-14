import { useState } from 'react'
import { LANGUAGES, PLATFORMS } from '../prefs.js'
import { chip, primary, quiet } from '../ui.js'

// S6, Preferences: which services you have and which languages you watch in. Asked once before the first search,
// editable from the header. Same type, chips and amber button as S1; nothing new.

export default function Preferences({ initial, firstRun, onSave, onSkip }) {
  const [platforms, setPlatforms] = useState(initial?.platforms || [])
  const [languages, setLanguages] = useState(initial?.languages || [])
  const [subtitlesOk, setSubtitlesOk] = useState(initial?.subtitles_ok || false)
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <form
      className="mx-auto max-w-page px-4 pt-12 pb-16 md:px-12 md:pt-16"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ platforms, languages, subtitles_ok: subtitlesOk })
      }}
    >
      <h1 className="max-w-[900px] text-headline font-medium [text-wrap:balance] md:text-headline-lg">
        {firstRun ? <>First, <span className="font-normal">what do you watch on?</span></> : <>What you <span className="font-normal">watch on</span></>}
      </h1>
      <p className="mt-4 max-w-read text-lead text-muted">So your three are things you can press play on tonight. Saved in this browser only.</p>

      <div role="group" aria-labelledby="pref-platforms" className="mt-8">
        <p id="pref-platforms" className="text-caption text-muted">Services you have</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p} type="button" aria-pressed={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)} className={chip}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-labelledby="pref-languages" className="mt-6">
        <p id="pref-languages" className="text-caption text-muted">Languages you watch in</p>
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
        <button type="submit" className={primary}>
          {firstRun ? 'Save and find my watch' : 'Save'}
        </button>
        <button type="button" onClick={onSkip} className={`${quiet} text-body`}>
          {firstRun ? 'Skip for now' : 'Cancel'}
        </button>
      </div>
    </form>
  )
}
