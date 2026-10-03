import FilmCard from '../components/FilmCard.jsx'

// S4, Watchlist: titles saved from any pick, newest first, as the same tickets in the same tint order as S2.
// Tapping "On your watchlist" takes a title off; taking the last one off shows the empty state.

const TINT_ORDER = ['rose', 'mint', 'marigold']
const primary = 'inline-flex min-h-[48px] items-center rounded-pill bg-curtain px-6 text-body font-medium text-screen'

export default function Watchlist({ list, compareIds, compareFull, mine, onSave, onCompare, onFind }) {
  return (
    <main className="mx-auto max-w-column px-4 pt-12 pb-16 text-ink dark:text-screen md:pt-16">
      <h1 className="font-display text-headline [text-wrap:balance] md:text-headline-lg">Your watchlist</h1>
      {list.length === 0 ? (
        <div role="status">
          <p className="mt-4 text-lead">Nothing saved yet. Tap “Add to watchlist” on any pick and it waits here for you.</p>
          <button type="button" onClick={onFind} className={`mt-8 ${primary}`}>
            Find something
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 text-lead">
            {list.length === 1 ? 'One title' : `${list.length} titles`} saved in this browser only.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            {list.map((card, i) => (
              <FilmCard
                key={card.id}
                card={card}
                tint={TINT_ORDER[i % 3]}
                saved
                onSave={onSave}
                comparing={compareIds.includes(card.id)}
                compareFull={compareFull}
                onCompare={onCompare}
                mine={mine}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
