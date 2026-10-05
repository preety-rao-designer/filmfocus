import { useState } from 'react'
import { chip, quiet } from '../ui.js'
import { dueForMatch, markAsked, snooze, sendVote, track } from '../track.js'

// Launch L5, "Did this match?": under S1, one quiet question about a title they chose last time (opened on a service
// or saved), at least 3 hours later. An answer retires the title; "Haven't watched it yet" asks again in a day.
// Same type, chips and rule as the rest of S1; nothing new.
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
    <section aria-labelledby="match-q" className="mx-auto max-w-page px-4 pb-16 md:px-12">
      <div className="max-w-read border-t border-line pt-8">
        {done ? (
          <p role="status" className="text-body">
            {done === 'skip' ? 'We’ll ask tomorrow.' : 'Thanks. That helps us pick better for you and everyone.'}
          </p>
        ) : (
          <>
            <p id="match-q" className="text-body text-muted">
              Last time you chose <span className="font-medium text-paper">{due.title}</span>. Did it match your mood?
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
              className={`${quiet} mt-4 text-body`}
            >
              Haven’t watched it yet
            </button>
          </>
        )}
      </div>
    </section>
  )
}
