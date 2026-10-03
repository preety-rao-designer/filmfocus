// Firestore, server-side only. The service account comes from FIREBASE_SERVICE_ACCOUNT (base64 of the JSON key),
// never from the browser. Without it (tests, a fork without keys) `db()` is null and callers carry on without it.
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let cached
export function db() {
  if (cached !== undefined) return cached
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return (cached = null)
  try {
    const sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    const app = getApps()[0] || initializeApp({ credential: cert(sa) })
    cached = getFirestore(app)
  } catch {
    cached = null
  }
  return cached
}

// The visitor's IP as Vercel passes it, for per-visitor limits. Never stored.
export const ipOf = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'local'
