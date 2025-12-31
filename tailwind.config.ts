import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // Professional Enterprise Color System
        primary: {
          DEFAULT: '#1F2937', // Slate 800
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#4F46E5', // Indigo 600
          foreground: '#FFFFFF',
        },
        background: '#F9FAFB', // Page background
        foreground: '#111827', // Primary text
        card: {
          DEFAULT: '#FFFFFF', // Card surfaces
          foreground: '#111827',
        },
        muted: {
          DEFAULT: '#F3F4F6', // Subtle sections
          foreground: '#6B7280', // Muted text
        },
        border: '#E5E7EB', // Borders
        input: '#E5E7EB',
        ring: '#4F46E5', // Focus ring
        
        // Status colors (semantic only)
        success: '#16A34A',
        warning: '#D97706', 
        destructive: '#DC2626',
        
        // shadcn/ui compatibility
        accent: {
          DEFAULT: '#F3F4F6',
          foreground: '#111827',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
