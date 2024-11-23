import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      spacing: {
        navbar: "56px",
        toolbar: "48px",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
} satisfies Config;
