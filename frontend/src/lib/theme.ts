export const VITO_THEME = {
  colors: {
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
    surfaceSoft: '#F1F5F8',
    text: '#0B1728',
    textSecondary: '#526174',
    textMuted: '#8995A5',
    border: '#E5EAF0',
    semantic: {
      success: '#16A67A',
      warning: '#F4A340',
      danger: '#E5484D',
      info: '#3984E8',
      gold: '#C9A45C',
      goldSoft: '#F5EBD5',
    },
    aiGradient: 'linear-gradient(135deg, #00C2B3 0%, #7567E8 100%)',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
    h2: 'text-2xl sm:text-3xl font-bold tracking-tight',
    h3: 'text-lg sm:text-xl font-bold',
    body: 'text-sm sm:text-base leading-relaxed',
    small: 'text-xs leading-normal',
  },
  radius: {
    card: 'rounded-2xl', // 16px
    medium: 'rounded-xl', // 12px
    small: 'rounded-lg', // 10px
    pill: 'rounded-full', // Badges strictly
  },
  shadows: {
    light: 'shadow-[0_4px_20px_rgba(7,17,31,0.06)]',
    hover: 'shadow-[0_8px_28px_rgba(7,17,31,0.10)]',
  },
} as const;

export default VITO_THEME;
