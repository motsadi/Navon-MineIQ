/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f1f5fb",
          100: "#dde7f3",
          700: "#16233f",
          800: "#101a30",
          900: "#0b1322",
          950: "#070d18",
        },
        accent: {
          DEFAULT: "#2f9bf0",
          50: "#eef7ff",
          100: "#d9edff",
          400: "#54aef4",
          500: "#2f9bf0",
          600: "#1d7fd6",
          700: "#1865ab",
        },
        sand: {
          400: "#d9b878",
          500: "#c9a25f",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        cardlg: "0 4px 16px rgba(16,24,40,0.08)",
      },
    },
  },
  plugins: [],
};
