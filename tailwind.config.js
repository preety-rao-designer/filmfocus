// Tokens from docs/DESIGN_DIRECTION.md. Every screen uses these names; add nothing here that the direction doesn't name.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'media',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      curtain: { DEFAULT: '#5B1224', deep: '#2B0A14' },
      screen: '#F5F6F8',
      ink: '#2E1119',
      rose: '#F2C4CE',
      mint: '#C9E4D0',
      marigold: '#F3D27A',
      brass: '#9C7A2E',
    },
    fontFamily: {
      display: ['"Rozha One"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
      sans: ['Mukta', '"Noto Sans"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', '"Noto Sans Bengali"', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      caption: ['14px', { lineHeight: '1.5' }],
      body: ['16px', { lineHeight: '1.5' }],
      lead: ['18px', { lineHeight: '1.5' }],
      section: ['22px', { lineHeight: '1.5' }],
      title: ['32px', { lineHeight: '1.1' }],
      'title-lg': ['36px', { lineHeight: '1.1' }],
      headline: ['44px', { lineHeight: '1.1' }],
      'headline-lg': ['56px', { lineHeight: '1.1' }],
    },
    spacing: {
      0: '0', px: '1px', 0.5: '2px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px', 16: '64px',
      notch: '10px', counterfoil: '176px', full: '100%',
    },
    borderRadius: { none: '0', ticket: '14px', pill: '999px', full: '9999px' },
    boxShadow: {
      none: 'none',
      ticket: '0 1px 0 rgba(46,17,25,.08), 0 8px 24px -12px rgba(46,17,25,.25)',
    },
    maxWidth: { column: '720px', none: 'none', full: '100%' },
    extend: {},
  },
  plugins: [],
}
