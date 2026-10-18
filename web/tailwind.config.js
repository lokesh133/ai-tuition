/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          saffron: '#FF6B35',
          'saffron-dark': '#E85520',
          indigo: '#4F46E5',
          purple: '#6366F1',
          teal: '#06D6A0',
          emerald: '#10B981',
          amber: '#F59E0B',
          slate: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', '"Noto Sans Devanagari"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        reader: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
