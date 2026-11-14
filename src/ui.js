// Shared control styles and image helpers for "The Late Show" (docs/DESIGN_DIRECTION.md). Tokens only.
export const btn =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-pill border border-line px-6 text-body font-normal text-paper ' +
  'hover:border-paper disabled:opacity-50 disabled:hover:border-line ' +
  'aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-night'
export const primary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-pill bg-amber px-6 text-body font-medium text-night ' +
  'hover:bg-amber-hover disabled:opacity-50 disabled:hover:bg-amber'
export const chip =
  'inline-flex min-h-[44px] items-center rounded-pill border border-line bg-paper/5 px-4 text-caption text-paper hover:border-paper ' +
  'aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-night'
export const quiet = 'min-h-[44px] text-muted underline decoration-1 underline-offset-4 hover:text-paper'
export const round =
  'inline-flex h-[44px] w-[44px] items-center justify-center rounded-pill border border-line bg-night/40 text-body text-paper hover:border-paper disabled:opacity-40'

const IMG = 'https://image.tmdb.org/t/p/'
export const posterUrl = (card, size = 'w342') => (card?.poster_path ? `${IMG}${size}${card.poster_path}` : null)
// The wide still behind a title; a card without one (older on-demand cards) falls back to its poster.
export const backdropUrl = (card) =>
  card?.backdrop_path ? `${IMG}w1280${card.backdrop_path}` : card?.poster_path ? `${IMG}w780${card.poster_path}` : null
export const two = (n) => String(n).padStart(2, '0')

// Title size by length: short titles get the full display size; long ones ("The Lord of the Rings: The Fellowship of
// the Ring") step down so they sit on one or two lines instead of four.
export const titleSize = (title = '') =>
  title.length > 40 ? 'text-[24px] leading-[1.1] tracking-tight md:text-[32px]'
  : title.length > 24 ? 'text-[26px] leading-[1.08] tracking-tight md:text-[38px]'
  : 'text-title md:text-title-lg'
