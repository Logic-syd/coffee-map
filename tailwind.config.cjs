/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pinkcream: "#FFEFEF",
        pinkaccent: "#FFD1DC",
        yolkyellow: "#FFF9C4",
        mintice: "#AEEFEC",
        graytext: "#6B7280",
        inkblack: "#111827",
      },
      boxShadow: {
        card: "0 4px 8px rgba(0,0,0,.06)",
        input: "0 1px 4px rgba(0,0,0,.05)",
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
