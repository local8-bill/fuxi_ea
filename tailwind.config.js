/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/ui/**/*.{js,ts,jsx,tsx}",
    "./src/controllers/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    'bg-green-50','border-green-300',
    'bg-yellow-50','border-yellow-300',
    'bg-orange-50','border-orange-300',
    'bg-red-50','border-red-300',
  ],
};
