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
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        vito: {
          navy: {
            950: '#07111F',
            900: '#0B1728',
            800: '#10243A',
            700: '#17334F',
            600: '#1F4264',
          },
          teal: {
            600: '#00A99D',
            500: '#00C2B3',
            400: '#29D6C7',
            300: '#72E7DD',
            100: '#E6FAF8',
            50: '#F0FCFB',
          },
          bg: '#F7F9FC',
          surface: '#FFFFFF',
          'surface-soft': '#F1F5F8',
          text: '#0B1728',
          'text-secondary': '#526174',
          'text-muted': '#8995A5',
          border: '#E5EAF0',
          'border-soft': '#EEF2F6',
          success: '#16A67A',
          'success-soft': '#E8F7F2',
          warning: '#F4A340',
          'warning-soft': '#FEF6EB',
          danger: '#E5484D',
          'danger-soft': '#FDE8E9',
          info: '#3984E8',
          'info-soft': '#EDF4FD',
          gold: '#C9A45C',
          'gold-soft': '#F5EBD5',
        },
      },
      borderRadius: {
        'card': '16px',
        'vito-md': '12px',
        'vito-sm': '10px',
      },
      boxShadow: {
        'vito': '0 4px 20px rgba(7, 17, 31, 0.06)',
        'vito-hover': '0 8px 28px rgba(7, 17, 31, 0.10)',
        'vito-lg': '0 12px 36px rgba(7, 17, 31, 0.12)',
        'vito-teal': '0 0 20px rgba(0, 194, 179, 0.35)',
        'vito-danger': '0 0 24px rgba(229, 72, 77, 0.45)',
      },
      backgroundImage: {
        'vito-ai': 'linear-gradient(135deg, #00C2B3 0%, #7567E8 100%)',
        'vito-gold': 'linear-gradient(135deg, #C9A45C 0%, #E5C384 100%)',
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
      },
    },
  },
  plugins: [],
};

export default config;
