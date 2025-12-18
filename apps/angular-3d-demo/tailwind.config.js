const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // ============================================
      // CUSTOM DESIGN SYSTEM TOKENS
      // Based on: docs/design-system/designs-systems.md
      // ============================================

      colors: {
        // Primary Brand Colors
        primary: {
          50: '#EDEFFF',
          100: '#D4D7FF',
          200: '#B4B8FF',
          300: '#9499FF',
          400: '#7479FF',
          500: '#6366F1', // Main brand color (highlights, CTAs)
          600: '#4F52CC',
          700: '#3B3EA8',
          800: '#272A84',
          900: '#13166B',
        },

        // Neon Accent (INK Games inspired)
        neon: {
          green: '#A1FF4F',
          blue: '#4FFFDF',
          purple: '#D946EF',
          pink: '#FF6BD4',
        },

        // Text Colors
        text: {
          primary: '#23272F', // Body text
          secondary: '#71717A', // Muted text
          inverse: '#FFFFFF', // Dark backgrounds
        },

        // Background Colors
        background: {
          white: '#FFFFFF',
          light: '#F9FAFB',
          dark: '#0A0E11', // Deep black (INK Games inspired)
          card: '#FFFFFF',
        },

        // Border Colors
        border: {
          light: '#E5E7EB',
          medium: '#D1D5DB',
          dark: '#9CA3AF',
        },

        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        // Base text scaling
        base: ['18px', { lineHeight: '1.6' }],

        // Headings
        'display-xl': ['4rem', { lineHeight: '1.1', fontWeight: '700' }], // 64px
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }], // 56px
        'display-md': ['3rem', { lineHeight: '1.2', fontWeight: '700' }], // 48px
        'headline-lg': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }], // 40px
        'headline-md': ['2rem', { lineHeight: '1.3', fontWeight: '600' }], // 32px
        'headline-sm': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }], // 24px

        // Body
        'body-lg': ['1.125rem', { lineHeight: '1.6' }], // 18px
        'body-md': ['1rem', { lineHeight: '1.5' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5' }], // 14px

        // Utility
        caption: ['0.75rem', { lineHeight: '1.4' }], // 12px
      },

      spacing: {
        // Design system spacing scale (8px base unit)
        '1x': '8px',
        '2x': '16px',
        '3x': '24px',
        '4x': '32px',
        '5x': '40px',
        '6x': '48px',
        '7x': '56px',
        '8x': '64px',
        '10x': '80px',
        '12x': '96px',
        '16x': '128px',
        '20x': '160px',
      },

      borderRadius: {
        card: '16px',
        button: '8px',
        input: '8px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },

      boxShadow: {
        // Card shadows (subtle, generous)
        card: '0 4px 32px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 48px rgba(0, 0, 0, 0.08)',

        // Button shadows
        button: '0 2px 8px rgba(99, 102, 241, 0.15)',
        'button-hover': '0 4px 16px rgba(99, 102, 241, 0.25)',

        // Neon glow effects
        'neon-green': '0 0 20px rgba(161, 255, 79, 0.5)',
        'neon-blue': '0 0 20px rgba(79, 255, 223, 0.5)',
        'neon-purple': '0 0 20px rgba(217, 70, 239, 0.5)',
      },

      // Animation durations
      transitionDuration: {
        50: '50ms',
        150: '150ms',
        250: '250ms',
        350: '350ms',
        450: '450ms',
      },

      // Custom keyframes for animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in-right 0.5s ease-out',
        glow: 'glow-pulse 2s ease-in-out infinite',
      },

      // Container max-widths
      maxWidth: {
        container: '1280px',
        content: '1024px',
        narrow: '768px',
      },
    },
  },
  plugins: [],
};
