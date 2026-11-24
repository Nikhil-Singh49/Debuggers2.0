/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        navy: {
          DEFAULT: '#0F172A',
          dark: '#0a0f1d',
          soft: '#1e293b',
        },
        ink: {
          DEFAULT: '#0F172A',
          light: '#334155',
        },
        muted: '#64748B',
        line: '#E2E8F0',
        brand: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          soft: '#EFF6FF',
        },
        blue: {
          DEFAULT: '#2563EB',
          dark: '#1d4ed8',
          soft: '#eff6ff',
        },
        cyan: {
          DEFAULT: '#4D7C0F',
          dark: '#3F6212',
          soft: '#F7FEE7',
        },
        green: {
          DEFAULT: '#4D7C0F',
          dark: '#3F6212',
          soft: '#F7FEE7',
        },
        orange: {
          DEFAULT: '#F59E0B',
          dark: '#d97706',
          soft: '#fffbeb',
        },
        yellow: {
          DEFAULT: '#EAB308',
          soft: '#fefce8',
        },
        red: {
          DEFAULT: '#DC2626',
          dark: '#b91c1c',
          soft: '#fef2f2',
        },
        indigo: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          soft: '#EFF6FF',
        },
        lime: {
          DEFAULT: '#84CC16',
          dark: '#4D7C0F',
          soft: '#F7FEE7',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15,23,42,0.04), 0 1px 2px -1px rgba(15,23,42,0.04)',
        float: '0 20px 35px -10px rgba(15,23,42,0.12)',
        toast: '0 12px 35px -5px rgba(15,23,42,0.2)',
        glow: '0 0 25px -5px rgba(79,70,229,0.3)',
        glass: '0 8px 32px 0 rgba(31,38,135,0.07)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'float-orb': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(15px, -20px) scale(1.08)' },
        },
        'border-spin': {
          '100%': { transform: 'rotate(360deg)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-orb': 'float-orb 7s ease-in-out infinite',
        'border-spin': 'border-spin 8s linear infinite',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};


