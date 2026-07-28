import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'alltech-orange': '#FF7924',
        'alltech-blue': '#1351A9',
        'alltech-gray': '#ADB2B4',
        'alltech-wine': '#805060',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
