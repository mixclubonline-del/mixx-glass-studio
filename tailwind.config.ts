import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        ink: {
          DEFAULT: "#F1F5F9",
          soft: "#CBD5E1",
          muted: "rgba(241, 245, 249, 0.6)",
          subtle: "rgba(241, 245, 249, 0.4)",
          inverted: "#0A0A0F",
        },
        glass: {
          surface: "rgba(15, 15, 26, 0.85)",
          soft: "rgba(26, 16, 51, 0.72)",
          elevated: "rgba(139, 92, 246, 0.08)",
          border: "rgba(139, 92, 246, 0.25)",
          mist: "rgba(139, 92, 246, 0.12)",
        },
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
        // ═══════════════════════════════════════════════════════════════════
        // AURA BRAND PALETTE
        // ═══════════════════════════════════════════════════════════════════
        aura: {
          // Primary: Violet (creativity, mystical, premium)
          violet: {
            DEFAULT: "#8B5CF6",
            50: "#F5F3FF",
            100: "#EDE9FE",
            200: "#DDD6FE",
            300: "#C4B5FD",
            400: "#A78BFA",
            500: "#8B5CF6",
            600: "#7C3AED",
            700: "#6D28D9",
            800: "#5B21B6",
            900: "#4C1D95",
          },
          // Secondary: Magenta (energy, passion)
          magenta: {
            DEFAULT: "#EC4899",
            light: "#F472B6",
            dark: "#DB2777",
          },
          // Tertiary: Cyan (flow state, technology)
          cyan: {
            DEFAULT: "#22D3EE",
            light: "#67E8F9",
            dark: "#06B6D4",
          },
          // Accent: Amber (premium, golden quality)
          amber: {
            DEFAULT: "#F59E0B",
            light: "#FBBF24",
            dark: "#D97706",
          },
          // Deep: Indigo (spirituality, depth)
          indigo: {
            DEFAULT: "#6366F1",
            light: "#818CF8",
            dark: "#4F46E5",
          },
          // Backgrounds
          space: "#0A0A0F",
          night: "#0F0F1A",
          twilight: "#1A1033",
          deep: "#12081F",
        },
        // Legacy support (gradual migration)
        mixx: {
          blue: "#56C8FF",
          violet: "#8B5CF6", 
          magenta: "#EC4899",
          pink: "#F472B6",
          ice: "#F1F5F9",
        },
        velvet: {
          50: "#F5F3FF",
          100: "#EDE9FE", 
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
      },
      boxShadow: {
        'mixx-elev': '0 8px 30px rgba(26,21,44,0.08)',
        'mixx-focus': '0 0 0 4px rgba(110,86,255,0.12)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'mixx-lg': '12px',
        'mixx-xl': '14px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(167, 124, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(167, 124, 255, 0.6)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;