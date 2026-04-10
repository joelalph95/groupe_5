/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        danger: '#ef4444',
        success: '#10b981',
        info: '#06b6d4',
        warn: '#f59e0b',
        dark: '#0a0a0f',
        card: '#14141e',
        border: '#2a2a35',
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out infinite 1s',
        'slide-up': 'slideUp 0.3s ease',
        'pulse-sos': 'pulse-sos 1.5s infinite',
        'pulse-ring': 'pulse-ring 1.5s infinite',
        'pulse': 'pulse 1.8s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(40px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-sos': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' },
          '50%': { boxShadow: '0 0 0 20px rgba(239,68,68,0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.6)' },
          '70%': { boxShadow: '0 0 0 12px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
      },
    },
  },
  plugins: [],
}