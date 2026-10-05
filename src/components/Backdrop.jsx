import { useEffect, useState } from 'react'

// The full-bleed still behind a title (results and its own page). Two layers crossfade when the image changes, so a
// new pick fades in over the old one. Phone: the top 70% of the screen; desktop: all of it. The scrim keeps text legible.
export default function Backdrop({ url }) {
  const [layers, setLayers] = useState([url, null])
  const [top, setTop] = useState(0)
  useEffect(() => {
    if (url === layers[top]) return
    const next = top ^ 1
    setLayers((l) => Object.assign([...l], { [next]: url }))
    setTop(next)
  }, [url])
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {layers.map((u, i) => (
        <div
          key={i}
          className={`backdrop absolute inset-x-0 top-0 h-[70svh] bg-cover bg-[center_25%] bg-no-repeat md:h-full ${i === top && u ? 'on' : ''}`}
          style={u ? { backgroundImage: `url(${u})` } : undefined}
        />
      ))}
      <div className="scrim absolute inset-0" />
    </div>
  )
}
