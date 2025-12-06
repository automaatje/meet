/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-brand-primary',
    'text-brand-primary',
    'border-brand-primary',
    'bg-brand-secondary',
    'text-brand-secondary',
    'border-brand-secondary',
    'bg-brand-accent',
    'text-brand-accent',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary, #2563EB)',
          secondary: 'var(--color-secondary, #10B981)',
          accent: 'var(--color-accent, #F59E0B)',
          bg: 'var(--color-background, #FFFFFF)',
          text: 'var(--color-text, #1F2937)',
        },
      },
      fontFamily: {
        'brand': ['var(--font-family, Inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
