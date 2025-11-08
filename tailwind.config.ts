import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Prime purple scale
        prime: {
          50: "hsl(var(--prime-50))",
          100: "hsl(var(--prime-100))",
          200: "hsl(var(--prime-200))",
          300: "hsl(var(--prime-300))",
          400: "hsl(var(--prime-400))",
          500: "hsl(var(--prime-500))",
          600: "hsl(var(--prime-600))",
          700: "hsl(var(--prime-700))",
          800: "hsl(var(--prime-800))",
          900: "hsl(var(--prime-900))",
        },
        
        // Neon color scales
        neon: {
          blue: {
            50: "hsl(var(--neon-blue-50))",
            100: "hsl(var(--neon-blue-100))",
            200: "hsl(var(--neon-blue-200))",
            300: "hsl(var(--neon-blue-300))",
            400: "hsl(var(--neon-blue-400))",
            500: "hsl(var(--neon-blue-500))",
            600: "hsl(var(--neon-blue-600))",
            700: "hsl(var(--neon-blue-700))",
            800: "hsl(var(--neon-blue-800))",
            900: "hsl(var(--neon-blue-900))",
          },
          pink: {
            50: "hsl(var(--neon-pink-50))",
            100: "hsl(var(--neon-pink-100))",
            200: "hsl(var(--neon-pink-200))",
            300: "hsl(var(--neon-pink-300))",
            400: "hsl(var(--neon-pink-400))",
            500: "hsl(var(--neon-pink-500))",
            600: "hsl(var(--neon-pink-600))",
            700: "hsl(var(--neon-pink-700))",
            800: "hsl(var(--neon-pink-800))",
            900: "hsl(var(--neon-pink-900))",
          },
          green: {
            50: "hsl(var(--neon-green-50))",
            100: "hsl(var(--neon-green-100))",
            200: "hsl(var(--neon-green-200))",
            300: "hsl(var(--neon-green-300))",
            400: "hsl(var(--neon-green-400))",
            500: "hsl(var(--neon-green-500))",
            600: "hsl(var(--neon-green-600))",
            700: "hsl(var(--neon-green-700))",
            800: "hsl(var(--neon-green-800))",
            900: "hsl(var(--neon-green-900))",
          },
          orange: {
            50: "hsl(var(--neon-orange-50))",
            100: "hsl(var(--neon-orange-100))",
            200: "hsl(var(--neon-orange-200))",
            300: "hsl(var(--neon-orange-300))",
            400: "hsl(var(--neon-orange-400))",
            500: "hsl(var(--neon-orange-500))",
            600: "hsl(var(--neon-orange-600))",
            700: "hsl(var(--neon-orange-700))",
            800: "hsl(var(--neon-orange-800))",
            900: "hsl(var(--neon-orange-900))",
          },
          teal: {
            50: "hsl(var(--neon-teal-50))",
            100: "hsl(var(--neon-teal-100))",
            200: "hsl(var(--neon-teal-200))",
            300: "hsl(var(--neon-teal-300))",
            400: "hsl(var(--neon-teal-400))",
            500: "hsl(var(--neon-teal-500))",
            600: "hsl(var(--neon-teal-600))",
            700: "hsl(var(--neon-teal-700))",
            800: "hsl(var(--neon-teal-800))",
            900: "hsl(var(--neon-teal-900))",
          },
        },
        
        // Gray scale
        gray: {
          50: "hsl(var(--gray-50))",
          100: "hsl(var(--gray-100))",
          200: "hsl(var(--gray-200))",
          300: "hsl(var(--gray-300))",
          400: "hsl(var(--gray-400))",
          500: "hsl(var(--gray-500))",
          600: "hsl(var(--gray-600))",
          700: "hsl(var(--gray-700))",
          800: "hsl(var(--gray-800))",
          900: "hsl(var(--gray-900))",
          950: "hsl(var(--gray-950))",
        },
        
        // Semantic colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        
        // Base tokens
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
