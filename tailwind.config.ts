import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./frontend/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        uber: {
          black:  "#000000",
          white:  "#ffffff",
          "body-gray":   "#4b4b4b",
          "muted-gray":  "#afafaf",
          "chip-gray":   "#efefef",
          "hover-gray":  "#e2e2e2",
          "hover-light": "#f3f3f3",
        },
      },
      fontFamily: {
        // UberMove approximated with system-ui / Inter
        sans: ["system-ui", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
      },
      boxShadow: {
        card:     "rgba(0,0,0,0.12) 0px 4px 16px 0px",
        "card-md": "rgba(0,0,0,0.16) 0px 4px 16px 0px",
        float:    "rgba(0,0,0,0.16) 0px 2px 8px 0px",
      },
      maxWidth: {
        container: "1136px",
      },
    },
  },
  plugins: [],
};

export default config;
