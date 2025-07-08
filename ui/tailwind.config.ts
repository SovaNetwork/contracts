import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sova Brand Colors
        'sova-black': {
          50: '#e8e8e8',
          100: '#b8b9b8',
          200: '#959795',
          300: '#656765',
          400: '#474947',
          500: '#191c19',
          600: '#171917',
          700: '#121412',
          800: '#0e0f0e',
          900: '#0b0c0b',
        },
        'sova-mint': {
          50: '#f3fef5',
          100: '#d9fbe0',
          200: '#c6f9d1',
          300: '#adf6bc',
          400: '#9df5af',
          500: '#84f29b',
          600: '#78dc8d',
          700: '#5eac6e',
          800: '#498555',
          900: '#376641',
        },
        // Keep some DeFi colors for gradients and accents
        'defi-purple': '#8B5CF6',
        'defi-pink': '#EC4899',
        'defi-blue': '#3B82F6',
        // Updated shadcn/ui colors with Sova palette
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        'slide-in': {
          '0%': {
            transform: 'translateY(-10px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'sova-gradient': 'linear-gradient(135deg, #84f29b, #5eac6e, #376641)',
        'sova-dark-gradient': 'linear-gradient(135deg, #0b0c0b, #191c19, #474947)',
        'defi-gradient': 'linear-gradient(135deg, #8B5CF6, #EC4899, #3B82F6)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'sova-glow': '0 0 20px rgba(132, 242, 155, 0.15)',
        'sova-glow-lg': '0 0 40px rgba(132, 242, 155, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config 