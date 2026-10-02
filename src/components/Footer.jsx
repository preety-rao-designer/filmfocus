// Credits the data sources require (Launch L7): TMDB's exact notice, JustWatch for streaming data (via TMDB's
// watch providers), Wikipedia (CC BY-SA) and Wikidata. Caption size, Ink at 70%, so it never competes with a ticket.
const link = 'underline decoration-1 underline-offset-4'

export default function Footer() {
  return (
    <footer className="mx-auto max-w-column px-4 pb-12 text-caption text-ink/70 dark:text-screen/70">
      <p>
        Film details from <a className={link} href="https://www.themoviedb.org/">TMDB</a>. This product uses the TMDB API but is
        not endorsed or certified by TMDB. Where to watch in India from <a className={link} href="https://www.justwatch.com/in">JustWatch</a>.
        Background from <a className={link} href="https://www.wikipedia.org/">Wikipedia</a> (CC BY-SA) and{' '}
        <a className={link} href="https://www.wikidata.org/">Wikidata</a>. Every card is written in our own words.
      </p>
    </footer>
  )
}
