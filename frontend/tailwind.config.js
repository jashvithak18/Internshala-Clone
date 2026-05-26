/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#008BDC', // Signature Internshala Blue
          600: '#0077c0', // Slightly darker hover blue
          700: '#0065a3',
          900: '#0c4a6e',
        },
        light: {
          bg: '#f8fafc',      // Slate 50/100 soft background
          card: '#ffffff',    // Plain white card
          border: '#e2e8f0',  // Slate 200 light border
          text: '#1e293b',    // Slate 800 high-contrast text
          muted: '#64748b'    // Slate 500 gray text
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
