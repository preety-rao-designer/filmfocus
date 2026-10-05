import { useEffect, useRef, useState } from 'react'
import { posterUrl, round } from '../ui.js'

// The home shelf (V2): tall poster strips from the store that drift slowly on their own. Hover (or focus) widens one
// and shows its title; tapping opens its page. People can scroll it by trackpad, swipe, mouse drag or the arrows. It
// loops: the list is there twice and the scroll position wraps at the halfway point. Drift stops while the pointer is
// on it, for a few seconds after any scroll, and entirely under reduced motion.

// One request per visit, shared with the results loading state (its slots shuffle these posters).
let shelfPromise = null
export function loadShelf() {
  shelfPromise ||= fetch('/api/shelf')
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((b) => b.items || [])
    .catch(() => {
      shelfPromise = null
      return []
    })
  return shelfPromise
}

const HEIGHTS = ['h-[300px] md:h-[380px]', 'mt-5 h-[282px] md:mt-6 md:h-[356px]', 'mt-2 h-[292px] md:mt-3 md:h-[368px]']

export default function Shelf({ onOpen }) {
  const [items, setItems] = useState([])
  const ref = useRef(null)
  const state = useRef({ hover: false, until: 0, carry: 0, drag: null, dragEnded: 0 })

  useEffect(() => {
    let live = true
    loadShelf().then((list) => live && setItems(list))
    return () => (live = false)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !items.length) return
    const s = state.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const half = () => el.scrollWidth / 2
    const wrap = () => {
      if (el.scrollLeft >= half()) el.scrollLeft -= half()
      else if (el.scrollLeft <= 0) el.scrollLeft += half()
    }
    el.scrollLeft = 1
    let raf
    const tick = (t) => {
      if (!still && !s.hover && !s.drag && t > s.until) {
        s.carry += 0.35
        const step = Math.floor(s.carry)
        s.carry -= step
        if (step) {
          el.scrollLeft += step
          wrap()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const hold = () => (s.until = performance.now() + 4000)
    const enter = () => (s.hover = true)
    const leave = () => (s.hover = false)
    // Mouse drag to scroll; a drag that ends over a poster doesn't count as a tap on it.
    const down = (e) => {
      if (e.pointerType === 'mouse') s.drag = { x: e.clientX, left: el.scrollLeft, moved: false }
    }
    const move = (e) => {
      if (!s.drag) return
      const dx = e.clientX - s.drag.x
      if (Math.abs(dx) > 4) s.drag.moved = true
      el.scrollLeft = s.drag.left - dx
      hold()
    }
    const up = () => {
      if (s.drag?.moved) s.dragEnded = performance.now()
      s.drag = null
    }
    el.addEventListener('scroll', wrap, { passive: true })
    el.addEventListener('wheel', hold, { passive: true })
    el.addEventListener('touchstart', hold, { passive: true })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', wrap)
      el.removeEventListener('wheel', hold)
      el.removeEventListener('touchstart', hold)
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [items])

  const nudge = (dir) => {
    const el = ref.current
    state.current.until = performance.now() + 4000
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: still ? 'auto' : 'smooth' })
  }

  if (!items.length) return <div className="h-[348px] md:h-[444px]" aria-hidden="true" />
  return (
    <section aria-label="Some of the titles we have honest cards for" className="pt-4 pb-12">
      <div ref={ref} className="no-scrollbar edge-fade cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing">
        <ul className="flex w-max px-4" style={{ gap: '10px' }}>
          {[...items, ...items].map((item, i) => (
            <li key={`${item.id}-${i}`} className={HEIGHTS[i % 3]} aria-hidden={i >= items.length || undefined}>
              <button
                type="button"
                tabIndex={i >= items.length ? -1 : 0}
                draggable={false}
                onClick={() => performance.now() - state.current.dragEnded > 250 && onOpen(item)}
                aria-label={`${item.title}, see its page`}
                className="strip group relative block h-full w-[72px] overflow-hidden rounded-poster bg-night-raised bg-cover bg-center brightness-[.8] saturate-[.85] hover:w-[200px] hover:brightness-100 hover:saturate-100 focus-visible:w-[200px] focus-visible:brightness-100 md:w-[96px] md:hover:w-[254px] md:focus-visible:w-[254px]"
                style={{ backgroundImage: `url(${posterUrl(item)})` }}
              >
                <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-3 bottom-3 text-left text-caption font-medium leading-tight opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {item.title}
                  <span className="block text-label font-normal text-muted">{item.year}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-4 flex max-w-page justify-end px-4 md:px-12" style={{ gap: '10px' }}>
        <button type="button" aria-label="Scroll the shelf left" onClick={() => nudge(-1)} className={round}>←</button>
        <button type="button" aria-label="Scroll the shelf right" onClick={() => nudge(1)} className={round}>→</button>
      </div>
    </section>
  )
}
