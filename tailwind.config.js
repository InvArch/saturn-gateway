/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    './src/**/*.html',
    "./node_modules/flowbite/**/*.js" // Flowbite JS source template path
  ],
  theme: {
    extend: {
      backdropBlur: {
        'none': '0',
        'blur': 'blur(5px)',
      },
      colors: {
        saturn: {
          'purple': '#692EFF', // purple 
          'darkpurple': 'rgba(105, 46, 255, .18)', // dark purple
          'white': '#FFFFFF', // white
          'offwhite': '#F9F9FB', // off white
          'black': '#010101', // black
          'darkgrey': '#0E0D11', // dark grey
          'lightgrey': '#888893', // light grey
          'green': '#2EFFA7', // green success
          'red': '#FF2E79', // red error
          'yellow': '#ECC265', // yellow
        },
      },
      fontFamily: {
        'sans': [ 'Inter', 'ui-sans-serif', 'system-ui' ],
      },
      fontSize: {
        [ 'xxs' ]: '0.625rem',
      }
    },
    screens: {
      xxs: '320px',
      xs: '414px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1440px',
    },
  },
  plugins: [
    require('flowbite/plugin') // require Flowbite's plugin for Tailwind CSS
  ],
}

