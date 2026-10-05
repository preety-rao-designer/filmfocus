// Credits the data sources require (Launch L7): TMDB's exact notice (V2 also shows TMDB images), JustWatch for
// streaming data (via TMDB's watch providers), Wikipedia (CC BY-SA) and Wikidata. Caption size, Muted.
const link = 'underline decoration-1 underline-offset-4 hover:text-paper'

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <p className="mx-auto max-w-page px-4 pt-6 pb-12 text-caption text-muted md:px-12">
        Film details and images from <a className={link} href="https://www.themoviedb.org/">TMDB</a>. This product uses the TMDB
        API but is not endorsed or certified by TMDB. Where to watch in India from <a className={link} href="https://www.justwatch.com/in">JustWatch</a>.
        Background from <a className={link} href="https://www.wikipedia.org/">Wikipedia</a> (CC BY-SA) and{' '}
        <a className={link} href="https://www.wikidata.org/">Wikidata</a>. Every card is written in our own words.
      </p>
    </footer>
  )
}
