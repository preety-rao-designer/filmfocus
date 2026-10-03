// node scripts/metrics.js [days=7] — the PRD's success metrics from real events in Firestore (Launch L6).
// Targets from docs/PRD.md: opens/saves per search ≥50%, "Did this match?" yes ≥70%, 7-day return ≥20%,
// refine/"show me others" under 40% of sessions. Reads only; prints counts, never visitor ids.
import { db } from '../api/_lib/firebase.js'

process.loadEnvFile('.env')
const days = Number(process.argv[2] || 7)
const since = new Date(Date.now() - days * 864e5).toISOString()
const firestore = db()
if (!firestore) throw new Error('FIREBASE_SERVICE_ACCOUNT missing')

// Local runs (the dev server, tests) are tagged `test` and left out.
const events = (await firestore.collection('events').where('at', '>=', since).get()).docs.map((d) => d.data()).filter((e) => !e.test)
const votes = (await firestore.collection('votes').where('at', '>=', since).get()).docs.map((d) => d.data()).filter((v) => !v.test)
const flagged = (await firestore.collection('cardStats').where('flagged', '==', true).get()).docs.map((d) => d.id)

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : 'n/a')
const of = (name) => events.filter((e) => e.name === name)
const searches = new Set(of('search').map((e) => e.search).filter(Boolean))
const engaged = new Set([...of('open'), ...of('save')].map((e) => e.search).filter((s) => searches.has(s)))
const redid = new Set([...of('others'), ...of('loosen')].map((e) => e.search).filter((s) => searches.has(s)))
const yes = votes.filter((v) => v.vote === 'yes').length

// 7-day return: of visitors whose first visit in the window is at least 7 days old, how many came back within 7 days.
const visits = new Map()
for (const e of of('visit')) visits.set(e.visitor, [...(visits.get(e.visitor) || []), Date.parse(e.at)])
let cohort = 0
let returned = 0
for (const times of visits.values()) {
  const first = Math.min(...times)
  if (Date.now() - first < 7 * 864e5) continue
  cohort++
  if (times.some((t) => t > first + 12 * 3600e3 && t <= first + 7 * 864e5)) returned++
}

console.log(`Last ${days} days · ${events.length} events · ${visits.size} visitors · ${searches.size} searches\n`)
console.log(`Searches with an open or save    ${pct(engaged.size, searches.size)}  (target ≥50%)`)
console.log(`"Did this match?" yes             ${pct(yes, votes.length)}  of ${votes.length} votes (target ≥70%)`)
console.log(`7-day return                      ${pct(returned, cohort)}  of ${cohort} visitors old enough to count (target ≥20%)`)
console.log(`Searches using others / loosen    ${pct(redid.size, searches.size)}  (target under 40%)`)
console.log(`\nAlso: ${of('make_card').length} cards made on request · ${of('compare').length} compare adds · cards flagged by 3+ "no" votes: ${flagged.length ? flagged.join(', ') : 'none'}`)
