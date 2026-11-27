/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-thai)', 'var(--font-barlow)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-poppins)', 'var(--font-barlow)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00b074',
          light: '#4cc89e',
          dark: '#009663',
          darker: '#005a3b',
        },
        secondary: {
          DEFAULT: '#5e6c93',
          light: '#8e98b3',
          dark: '#4b5776',
        },
        info: {
          DEFAULT: '#2d9cdb',
          light: '#6cbae6',
          dark: '#1f84bd',
        },
        danger: {
          DEFAULT: '#ff5b5b',
          light: '#ff8c8c',
          dark: '#e64545',
        },
        warning: {
          DEFAULT: '#f7c604',
          light: '#fad74f',
          dark: '#d6ab00',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f3f2f7',
          muted: '#ebeaf1',
          border: '#ebebeb',
        },
        ink: {
          DEFAULT: '#333333',
          muted: '#464255',
          subtle: '#a3a3a3',
        },
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 4px 8px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
