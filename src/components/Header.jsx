// The Curtain header band (docs/DESIGN_DIRECTION.md palette: "Curtain … header band"). The wordmark is UI text, so Mukta.
export default function Header({ onHome }) {
  return (
    <header className="bg-curtain">
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
