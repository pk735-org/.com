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
          dark: '#0A0A0A',
          green: '#04534A',
          lightGreen: '#03443C',
          deepGreen: '#02332C',
          borderGreen: '#023E37',
          gold: '#FED36A',
          yellow: '#FFE600',
          red: '#E53935',
          greenActive: '#00C853',
          textMuted: '#B8CEC9',
          textLight: '#E3E3E3',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
