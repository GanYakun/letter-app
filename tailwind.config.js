// tailwind.config.js
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts}'],
    theme: {
      extend: {
        colors: {
          journalBg: '#fdf6e3',
          journalText: '#4b3f39',
          accent: '#b48a78',
        },
        fontFamily: {
          journal: ['"Patrick Hand"', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }
  