import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    borderWidth: {
	'1': '1px',
	'2': '2px',
	'3': '3px'
    },
    extend: {},
  },
  plugins: [],
} satisfies Config;
