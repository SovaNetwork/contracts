// Modern DeFi Design System inspired by Uniswap
export const designSystem = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',  // Main orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    
    // Secondary/accent colors
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',  // Main blue
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Success/gain colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Main green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Error/loss colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Main red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Warning colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Main yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Neutral grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Border colors
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#64748b',
    },
  },
  
  // Gradients inspired by modern DeFi
  gradients: {
    primary: 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500',
    warm: 'bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50',
    cool: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    card: 'bg-gradient-to-br from-white to-slate-50',
  },
  
  // Shadows for depth
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    glow: 'shadow-lg shadow-primary-500/25',
    glowBlue: 'shadow-lg shadow-blue-500/25',
    glowGreen: 'shadow-lg shadow-green-500/25',
  },
  
  // Border radius
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  },
  
  // Typography scale
  typography: {
    display: 'text-4xl md:text-5xl lg:text-6xl font-bold',
    h1: 'text-3xl md:text-4xl font-bold',
    h2: 'text-2xl md:text-3xl font-bold',
    h3: 'text-xl md:text-2xl font-semibold',
    h4: 'text-lg md:text-xl font-semibold',
    body: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  },
  
  // Animation classes
  animations: {
    fadeIn: 'animate-in fade-in duration-500',
    slideIn: 'animate-in slide-in-from-bottom-4 duration-500',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },
};

// Helper function to get color variants
export function getColorVariant(color: keyof typeof designSystem.colors, variant: number = 500) {
  return designSystem.colors[color]?.[variant as keyof typeof designSystem.colors[typeof color]] || designSystem.colors.gray[500];
}

// Component style presets
export const componentStyles = {
  // Card variants
  card: {
    base: `${designSystem.borderRadius.xl} ${designSystem.shadows.md} border border-slate-200/60 bg-white/80 backdrop-blur-sm`,
    elevated: `${designSystem.borderRadius.xl} ${designSystem.shadows.lg} border border-slate-200/60 bg-white/90 backdrop-blur-md`,
    interactive: `${designSystem.borderRadius.xl} ${designSystem.shadows.md} border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:border-slate-300/60 transition-all duration-200`,
  },
  
  // Button variants  
  button: {
    primary: `${designSystem.borderRadius.lg} bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200`,
    secondary: `${designSystem.borderRadius.lg} bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200`,
    success: `${designSystem.borderRadius.lg} bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200`,
    outline: `${designSystem.borderRadius.lg} border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all duration-200`,
    ghost: `${designSystem.borderRadius.lg} hover:bg-slate-100 text-slate-700 font-medium transition-all duration-200`,
  },
  
  // Input variants
  input: {
    base: `${designSystem.borderRadius.lg} border border-slate-300 bg-white/90 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`,
    error: `${designSystem.borderRadius.lg} border border-red-300 bg-white/90 backdrop-blur-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200`,
  },
};

export default designSystem;