/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
        'hover': '0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)',
        'btn': '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.5)',
      },
    },
  },
  plugins: [],
};