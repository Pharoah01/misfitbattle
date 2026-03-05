/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Purple Cyber-Tech Theme
        purple: {
          primary: '#6B2DFF',
          secondary: '#7C3AED',
          tertiary: '#8B5CF6',
          dark: '#5B1FEF',
          light: '#9B6CFF',
        },
        // Primary Red - Accent color
        primary: {
          DEFAULT: '#C00000',
          dark: '#A00000',
          light: '#E00000',
        },
        // Orange Accent
        orange: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fb923c',
        },
        // Dark backgrounds
        dark: {
          bg: '#0B0B0B',
          surface: '#111111',
          border: '#2A2A2A',
        },
        // Text colors
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
        },
      },
      fontFamily: {
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(107, 45, 255, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(107, 45, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
