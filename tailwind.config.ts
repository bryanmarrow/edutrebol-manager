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
        talkee: {
          bg: '#F5F5F5',
          surface: '#FFFFFF',
          dark: '#181818',
          gray: '#8E8E8E',
          lightGray: '#E0E0E0',
          lime: '#BBF451',
          limeHover: '#AADE40',
          blue: '#007AFF',
          blueHover: '#0062CC',
        },
        status: {
          present: {
            DEFAULT: '#BBF451',
            bg: '#F0FFCC',
            text: '#181818',
          },
          absent: {
            DEFAULT: '#F43F5E', // rose-500
            bg: '#FFE4E6',      // rose-100
            text: '#BE123C',    // rose-700
          },
          late: {
            DEFAULT: '#007AFF',
            bg: '#DBEAFE',
            text: '#1D4ED8',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-outfit)', 'sans-serif'],
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
