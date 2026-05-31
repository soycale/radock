/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        rd: {
          bg: '#000000',
          surface: '#161616',
          border: '#2A2A2A',
          primary: '#FE2C55',
          secondary: '#25F4EE',
          success: '#25F4EE',
          danger: '#FE2C55',
          text: '#FFFFFF',
          muted: '#8A8A8A',
        },
      },
    },
  },
}
