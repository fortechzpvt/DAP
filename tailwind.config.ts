import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--cream-rgb) / <alpha-value>)",
        dark:  "rgb(var(--dark-rgb)  / <alpha-value>)",
        ice:   "rgb(var(--ice-rgb)   / <alpha-value>)",
        amber: "rgb(var(--amber-rgb) / <alpha-value>)",
        forest:"rgb(var(--forest-rgb)/ <alpha-value>)",
      },
      fontFamily: {
        display: ["Poppins", "Century Gothic", "system-ui", "sans-serif"],
        sans:    ["Jost", "Century Gothic", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
        widest3: "0.3em",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
