// The Curtain header band (docs/DESIGN_DIRECTION.md palette: "Curtain … header band"). The wordmark is UI text, so Mukta.
// The 2px Curtain-deep rule along the bottom is the counter-window slot the result tickets come through (Motion).
export default function Header({ onHome }) {
  return (
    <header className="border-b-2 border-curtain-deep bg-curtain">
      <div className="mx-auto max-w-column px-4 py-4">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onHome()
          }}
          className="text-lead font-bold text-screen"
        >
          FilmFocus
        </a>
      </div>
    </header>
  )
}
