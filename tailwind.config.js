// Tokens from docs/DESIGN_DIRECTION.md ("The Late Show", V2). Every screen uses these names; add nothing here that the
// direction doesn't name.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      night: { DEFAULT: '#0D0B0C', raised: '#171314' },
      paper: '#F4EFE9',
      muted: '#A9A19A',
      amber: { DEFAULT: '#F5B841', hover: '#FFC85C' },
      line: 'rgba(244,239,233,.14)',
      // V2.1: the home curtain. Velvet maroon from deep shadow to the lit fold.
      velvet: { deep: '#1C0508', DEFAULT: '#4A0D15', lit: '#8E2430' },
    },
    fontFamily: {
      sans: ['"Inter Tight"', '"Noto Sans Devanagari"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
    },
    fontWeight: { thin: '200', normal: '400', medium: '500', bold: '700' },
    fontSize: {
      label: ['12px', { lineHeight: '1.4' }],
      caption: ['14px', { lineHeight: '1.5' }],
      lead: ['18px', { lineHeight: '1.45' }],
      body: ['16px', { lineHeight: '1.5' }],
      read: ['20px', { lineHeight: '1.4' }],
      'read-lg': ['24px', { lineHeight: '1.35', letterSpacing: '-.01em' }],
      title: ['30px', { lineHeight: '1.08', letterSpacing: '-.02em' }],
      'title-lg': ['44px', { lineHeight: '1.06', letterSpacing: '-.02em' }],
      headline: ['32px', { lineHeight: '1.1', letterSpacing: '-.02em' }],
      'headline-lg': ['52px', { lineHeight: '1.06', letterSpacing: '-.025em' }],
      num: ['44px', { lineHeight: '.9', letterSpacing: '-.04em' }],
      'num-lg': ['64px', { lineHeight: '.9', letterSpacing: '-.04em' }],
    },
    spacing: {
      0: '0', px: '1px', 0.5: '2px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 12: '48px', 16: '64px',
      full: '100%',
    },
    borderRadius: { none: '0', poster: '10px', box: '20px', pill: '999px', full: '9999px' },
    boxShadow: { none: 'none' },
    maxWidth: { page: '1240px', read: '560px', none: 'none', full: '100%' },
    screens: { sm: '640px', md: '900px' },
    extend: {},
  },
  plugins: [],
}
