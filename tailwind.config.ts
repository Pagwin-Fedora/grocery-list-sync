import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    borderWidth: {
	'3': '3px'
    },
    extend: {},
  },
  plugins: [],
} satisfies Config;
