import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171716",
        paper: "#f5f3ee",
        shell: "#ebe8e1",
        pearl: "#eadbd4",
        cyan: "#77ccd4",
        coral: "#d97d83"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 29, 24, .08)"
      }
    }
  },
  plugins: []
};

export default config;
