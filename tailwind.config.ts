import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        viems: {
          blue:       "#185FA5",
          "blue-mid": "#378ADD",
          "blue-light":"#E6F1FB",
          "blue-border":"#B5D4F4",
          green:      "#3B6D11",
          "green-bg": "#EAF3DE",
          amber:      "#854F0B",
          "amber-bg": "#FAEEDA",
          "amber-border":"#FAC775",
          red:        "#A32D2D",
          "red-bg":   "#FCEBEB",
          "red-border":"#F7C1C1",
          gray:       "#5F5E5A",
          "gray-bg":  "#F7F6F3",
          "gray-light":"#F1EFE8",
          "gray-border":"#D3D1C7",
          "sidebar":  "#0F1117",
          "sidebar-hover":"#1A1D27",
          "sidebar-active":"#1E2233",
          "sidebar-border":"#2A2D3A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
