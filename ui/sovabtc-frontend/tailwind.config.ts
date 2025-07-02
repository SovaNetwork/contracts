import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Sova Brand Colors
        'sova-black': {
          50: '#E8E8E8',
          100: '#B8B8B8',
          200: '#959795',
          300: '#656765',
          400: '#474947',
          500: '#191C19', // Primary black
          600: '#171917',
          700: '#121412',
          800: '#0E0F0E',
          900: '#0B0C0B',
        },
        'sova-mint': {
          50: '#F3FFF5',
          100: '#D9FBE0',
          200: '#C6F9D1',
          300: '#ADF6BC',
          400: '#9DF5AF',
          500: '#84F29B', // Primary mint
          600: '#78DC8D',
          700: '#5EAC6E',
          800: '#498555',
          900: '#376641',
        },
        // Shadcn/UI Colors with Sova theming
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'sova': '0 4px 20px -2px rgba(132, 242, 155, 0.15)',
        'sova-lg': '0 10px 40px -4px rgba(132, 242, 155, 0.2)',
      },
      backgroundImage: {
        'gradient-sova': 'linear-gradient(135deg, #84F29B 0%, #78DC8D 100%)',
        'gradient-sova-subtle': 'linear-gradient(135deg, rgba(132, 242, 155, 0.1) 0%, rgba(120, 220, 141, 0.05) 100%)',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config;

export default config; 