/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'recording-pulse': 'recording-pulse 1.8s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.25), 0 0 60px rgba(6, 182, 212, 0.08)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.45), 0 0 80px rgba(6, 182, 212, 0.15)',
          },
        },
        'recording-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.2)',
            transform: 'scale(1.03)',
          },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
