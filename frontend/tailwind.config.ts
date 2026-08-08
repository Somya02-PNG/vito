import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50:  "#E6EDF8",
          100: "#C0D1ED",
          200: "#96B2E0",
          300: "#6B93D3",
          400: "#3D6EBF",
          500: "#0B3D91",
          600: "#093380",
          700: "#07296A",
          800: "#051F54",
          900: "#03143E",
          950: "#020D2B",
        },
        accent: {
          50:  "#FFF3E6",
          100: "#FFE0BF",
          200: "#FFCA93",
          300: "#FFB266",
          400: "#FF9933",
          500: "#E85D04",
          600: "#CC5003",
          700: "#A64103",
          800: "#803202",
          900: "#5A2301",
          950: "#3D1801",
        },
        vito: {
          blue: "#2563EB",
          cyan: "#0891B2",
          accent: "#E85D04",
          dark: "#090D16",
          card: "#111827",
          border: "#1F2937",
          emerald: "#10B981"
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "vito-glow": "radial-gradient(circle at 50% 0%, rgba(11, 61, 145, 0.3), transparent 70%)",
        "hero-glow": "radial-gradient(ellipse at 50% 0%, rgba(11, 61, 145, 0.2), rgba(232, 93, 4, 0.05) 50%, transparent 80%)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      }
    },
  },
  plugins: [],
};

export default config;

