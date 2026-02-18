import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        status: {
          present: {
            DEFAULT: '#10B981', // emerald-500
            bg: '#D1FAE5',      // emerald-100
            text: '#047857',    // emerald-700
          },
          absent: {
            DEFAULT: '#F43F5E', // rose-500
            bg: '#FFE4E6',      // rose-100
            text: '#BE123C',    // rose-700
          },
          late: {
            DEFAULT: '#FBBF24', // amber-400
            bg: '#FEF3C7',      // amber-100
            text: '#92400E',    // amber-800
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'float': '0 4px 14px 0 rgba(0,0,0,0.1)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
} satisfies Config;
