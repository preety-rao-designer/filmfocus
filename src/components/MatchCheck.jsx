import { useState } from 'react'
import { chip } from '../screens/MoodInput.jsx'
import { dueForMatch, markAsked, snooze, sendVote, track } from '../track.js'

// Launch L5, "Did this match?": under S1, one quiet question about a title they chose last time (opened on a service
// or saved), at least 3 hours later. An answer retires the title; "Haven't watched it yet" asks again in a day.
// Same type, chips and rule weight as the rest of S1; nothing new.
const ANSWERS = [['yes', 'Yes'], ['partly', 'Partly'], ['no', 'No']]

export default function MatchCheck() {
  const [due] = useState(() => dueForMatch())
  const [done, setDone] = useState(null)
  if (!due) return null

  const answer = (vote) => {
    markAsked(due.id)
    setDone(vote)
    sendVote(due.id, vote)
    track('vote', { card: due.id, vote })
  }

  return (
    <section aria-labelledby="match-q" className="mx-auto max-w-column px-4 pb-16 text-ink dark:text-screen">
      <div className="border-t border-ink/20 pt-8 dark:border-screen/20">
        {done ? (
          <p role="status" className="text-body">
            {done === 'skip' ? 'We’ll ask tomorrow.' : 'Thanks. That helps us pick better for you and everyone.'}
          </p>
        ) : (
          <>
            <p id="match-q" className="text-body">
              Last time you chose <span className="font-medium">{due.title}</span>. Did it match your mood?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ANSWERS.map(([v, label]) => (
                <button key={v} type="button" onClick={() => answer(v)} className={chip}>
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                snooze(due.id)
                setDone('skip')
              }}
              className="mt-4 min-h-[44px] text-body underline decoration-1 underline-offset-4"
            >
              Haven’t watched it yet
            </button>
          </>
        )}
      </div>
    </section>
  )
}
