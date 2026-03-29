import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        void:    '#060810',   // deepest bg
        abyss:   '#0D1117',   // card bg
        surface: '#141B2D',   // elevated surface
        border:  '#1E2A40',   // borders
        muted:   '#2A3A5A',   // muted elements

        // Brand colors
        gold:    { DEFAULT: '#FFB800', light: '#FFD166', dark: '#CC9200' },
        flame:   { DEFAULT: '#FF6B35', light: '#FF9A6C', dark: '#CC4A1A' },
        sky:     { DEFAULT: '#00A8E8', light: '#66CCFF', dark: '#0077B3' },
        emerald: { DEFAULT: '#00E676', light: '#69F0AE', dark: '#00B248' },
        crimson: { DEFAULT: '#FF1744', light: '#FF6B7A', dark: '#C4001A' },

        // Text
        text: {
          primary:   '#F0F4FF',
          secondary: '#8899BB',
          muted:     '#4A5A7A',
        },
      },
      fontFamily: {
        display: ['var(--font-teko)', 'sans-serif'],
        body:    ['var(--font-jakarta)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'stadium':      'radial-gradient(ellipse at 50% 0%, #1a2a4a 0%, #060810 60%)',
        'gold-glow':    'radial-gradient(ellipse at center, #FFB80033 0%, transparent 70%)',
        'flame-glow':   'radial-gradient(ellipse at center, #FF6B3533 0%, transparent 70%)',
        'card-shine':   'linear-gradient(135deg, #ffffff08 0%, transparent 50%)',
        'hero-mesh':    'radial-gradient(at 40% 20%, #FF6B3511 0px, transparent 50%), radial-gradient(at 80% 0%, #FFB80011 0px, transparent 50%), radial-gradient(at 0% 50%, #00A8E811 0px, transparent 50%)',
      },
      boxShadow: {
        'gold':    '0 0 20px #FFB80044, 0 0 60px #FFB80022',
        'flame':   '0 0 20px #FF6B3544, 0 0 60px #FF6B3522',
        'sky':     '0 0 20px #00A8E844, 0 0 60px #00A8E822',
        'card':    '0 4px 24px #00000066, inset 0 1px 0 #ffffff08',
        'inset':   'inset 0 1px 0 #ffffff10, inset 0 -1px 0 #00000040',
      },
      animation: {
        'pulse-gold':   'pulse-gold 2s ease-in-out infinite',
        'slide-up':     'slide-up 0.5s ease forwards',
        'slide-down':   'slide-down 0.3s ease forwards',
        'fade-in':      'fade-in 0.4s ease forwards',
        'scale-in':     'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'timer-pulse':  'timer-pulse 1s ease-in-out infinite',
        'card-flip':    'card-flip 0.6s ease forwards',
        'bid-flash':    'bid-flash 0.5s ease forwards',
        'shimmer':      'shimmer 2s linear infinite',
        'float':        'float 3s ease-in-out infinite',
        'ticker':       'ticker 20s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px #FFB80044' },
          '50%':       { boxShadow: '0 0 40px #FFB80088, 0 0 80px #FFB80044' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'timer-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':       { transform: 'scale(1.05)' },
        },
        'card-flip': {
          '0%':   { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)',  opacity: '1' },
        },
        'bid-flash': {
          '0%':   { backgroundColor: '#FFB80033' },
          '100%': { backgroundColor: 'transparent' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'ticker': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
