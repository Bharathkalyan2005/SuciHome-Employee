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
          green: '#1B4332',  // Primary dark green
          gold: '#C9A84C',   // Accent gold
          cream: '#F5F0E8',  // Background cream
          dark: '#0D2B1F',   // Deep dark green
          text: '#2D4A35',   // Body text green
          lightGreen: '#EAF2EC', // Soft light green for highlights
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
