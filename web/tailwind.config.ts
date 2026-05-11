import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary system — premium deep olive (Hermès / Range Rover territory)
        primary: '#6B8333',          // medium olive — accents, glows, text-primary
        'primary-deep': '#2D3F0E',   // deep olive (swatch reference) — borders, dim bg
        'primary-light': '#94B048',  // bright olive — hover states, highlights
        'primary-haze': '#3D5118',   // mid-tone for gradients

        // Secondary — champagne metal (luxury accent, used sparingly)
        secondary: '#C9B27A',        // champagne gold
        'secondary-deep': '#9E8849', // deeper champagne for hover
        'secondary-light': '#E8DAB1',// pale champagne for highlights

        // Metal system — brushed titanium (CTAs, surfaces)
        metal: '#B8BABD',
        'metal-light': '#E0E2E5',
        'metal-dark': '#7A7C7E',

        // Backgrounds — testing cooler navy base (#091323 family)
        'bg-deep': '#091323',
        'bg-card': '#131C12',
        'bg-mid': '#0E160E',
        'bg-page': '#091323',

        // Surface tints
        'border-glow': 'rgba(107, 131, 51, 0.30)',
        'border-metal': 'rgba(184, 186, 189, 0.18)',
        'border-deep': 'rgba(45, 63, 14, 0.40)',

        // Warm off-white (premium feel — not pure white)
        'text-warm': '#F5F1E8',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient':
          'linear-gradient(180deg, #0c1d36 0%, #091323 48%, #040b1a 100%)',
        'glow-tr':
          'radial-gradient(circle at 100% 0%, rgba(107,131,51,0.20) 0%, transparent 65%)',
        'glow-bl':
          'radial-gradient(circle at 0% 100%, rgba(201,178,122,0.10) 0%, transparent 65%)',
        'card-gradient':
          'linear-gradient(135deg, #131C12 0%, #0E160E 50%, #08100A 100%)',
        // Metallic gradients (5-stop brushed effect)
        'metal-olive':
          'linear-gradient(135deg, #94B048 0%, #6B8333 25%, #4A5E26 50%, #6B8333 75%, #94B048 100%)',
        'metal-olive-deep':
          'linear-gradient(135deg, #6B8333 0%, #4A5E26 25%, #2D3F0E 50%, #4A5E26 75%, #6B8333 100%)',
        'metal-steel':
          'linear-gradient(135deg, #E0E2E5 0%, #B8BABD 25%, #7A7C7E 50%, #B8BABD 75%, #E0E2E5 100%)',
        'metal-champagne':
          'linear-gradient(135deg, #E8DAB1 0%, #C9B27A 25%, #9E8849 50%, #C9B27A 75%, #E8DAB1 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 28px rgba(148, 176, 72, 0.45)',
        'glow-card': '0 0 40px rgba(107, 131, 51, 0.10)',
        'glow-phone': '0 40px 80px rgba(107, 131, 51, 0.25)',
        // Metallic shadows (multi-layer for "polished metal" feel)
        metal:
          'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.45)',
        'metal-cta':
          'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -2px 1px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.50), 0 0 24px rgba(107,131,51,0.45)',
        'metal-cta-hover':
          'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 1px rgba(0,0,0,0.40), 0 0 0 1px rgba(0,0,0,0.30), 0 6px 20px rgba(0,0,0,0.50), 0 0 32px rgba(148,176,72,0.60)',
      },
      letterSpacing: {
        tightest: '-0.03em',
        'wider-uppercase': '0.14em',
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.04' },
          '50%': { opacity: '0.14' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
