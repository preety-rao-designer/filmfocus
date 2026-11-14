import { useEffect, useRef, useState } from 'react'
import { posterUrl } from '../ui.js'

// The home strip (V2.1, docs/DESIGN_DIRECTION.md): poster tiles in a slanted band that drifts slowly, like a reel
// running past, in front of the velvet curtain. No tile is singled out. Desktop: a vertical band down the left side,
// leaning like "/". Phones: a band across the top, tilted the same way. Hover or focus shows a tile's title and stops
// the drift; wheel, swipe or drag move it; a tap opens the title's page. It loops: the list is there twice and the
// offset wraps. Under reduced motion it doesn't drift.

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

const GAP = 10
const SIZES = { y: { tile: 176, speed: 18 }, x: { tile: 104, speed: 16 } } // px along the band, px a second

export default function Strip({ onOpen }) {
  const [items, setItems] = useState([])
  const [axis, setAxis] = useState(() => (window.matchMedia('(min-width: 900px)').matches ? 'y' : 'x'))
  const band = useRef(null)
  const track = useRef(null)
  const s = useRef({ offset: 0, hover: null, until: 0, drag: null, dragEnded: 0 })

  useEffect(() => {
    let live = true
    loadShelf().then((list) => live && setItems(list))
    const mq = window.matchMedia('(min-width: 900px)')
    const change = () => setAxis(mq.matches ? 'y' : 'x')
    mq.addEventListener('change', change)
    return () => {
      live = false
      mq.removeEventListener('change', change)
    }
  }, [])

  useEffect(() => {
    const el = band.current
    const tr = track.current
    if (!el || !tr || !items.length) return
    const st = s.current
    const { tile, speed } = SIZES[axis]
    const step = tile + GAP
    const loop = items.length * step
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const length = () => (axis === 'y' ? el.clientHeight : el.clientWidth)
    const place = () => {
      st.offset = ((st.offset % loop) + loop) % loop
      tr.style.transform = axis === 'y' ? `translate3d(0, ${-st.offset}px, 0)` : `translate3d(${-st.offset}px, 0, 0)`
    }
    st.offset = Math.max(0, tile / 2 - length() / 2 + step * 2)
    place()
    let raf
    let last = performance.now()
    const tick = (t) => {
      const dt = Math.min(64, t - last)
      last = t
      if (!still && st.hover === null && !st.drag && t > st.until) {
        st.offset += (speed * dt) / 1000
        place()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const hold = () => (st.until = performance.now() + 4000)
    const wheel = (e) => {
      e.preventDefault()
      st.offset += axis === 'y' ? e.deltaY : e.deltaX || e.deltaY
      hold()
      place()
    }
    const down = (e) => (st.drag = { p: axis === 'y' ? e.clientY : e.clientX, offset: st.offset, moved: false })
    const move = (e) => {
      if (!st.drag) return
      const d = (axis === 'y' ? e.clientY : e.clientX) - st.drag.p
      if (Math.abs(d) > 4) st.drag.moved = true
      st.offset = st.drag.offset - d
      hold()
      place()
    }
    const up = () => {
      if (st.drag?.moved) st.dragEnded = performance.now()
      st.drag = null
    }
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [items, axis])

  const hoverOn = (i) => {
    s.current.hover = i
  }
  const hoverOff = () => {
    s.current.hover = null
    s.current.until = performance.now() + 1500
  }

  const y = axis === 'y'
  const { tile } = SIZES[axis]
  return (
    <section
      aria-label="Some of the titles we have honest cards for"
      className={y ? 'strip-band-y absolute top-[72px] bottom-0 left-[calc(4vw+40px)] z-[1] w-[240px] lg:w-[280px]' : 'strip-band-x relative -mx-4 h-[176px]'}
    >
      <div ref={band} className={`touch-none select-none overflow-hidden ${y ? 'h-full' : 'h-full w-[calc(100%+64px)] -translate-x-8'}`}>
        <ul ref={track} className={`flex ${y ? 'flex-col' : 'h-full items-center'}`} style={{ gap: `${GAP}px` }}>
          {[...items, ...items].map((item, i) => {
            const n = i % items.length
            const copy = i >= items.length
            return (
              <li key={`${item.id}-${i}`} className="shrink-0" style={y ? { height: tile } : { width: tile, height: 156 }} aria-hidden={copy || undefined}>
                <button
                  type="button"
                  tabIndex={copy ? -1 : 0}
                  draggable={false}
                  onMouseEnter={() => hoverOn(n)}
                  onMouseLeave={hoverOff}
                  onFocus={() => hoverOn(n)}
                  onBlur={hoverOff}
                  onClick={() => performance.now() - s.current.dragEnded > 250 && onOpen(item)}
                  aria-label={`${item.title}, see its page`}
                  className="tile group relative block h-full w-full overflow-hidden rounded-poster bg-night-raised"
                >
                  <span className="tile-img absolute inset-0 bg-cover bg-[center_22%]" style={{ backgroundImage: `url(${posterUrl(item)})` }} />
                  <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <span className="tile-label absolute inset-x-3 bottom-3 text-left text-caption font-medium leading-tight opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="line-clamp-2">{item.title}</span>
                    <span className="block text-label font-normal text-muted tabular">{item.year}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
