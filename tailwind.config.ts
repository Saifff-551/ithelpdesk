import type { Config } from 'tailwindcss';

export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Force dark mode for observing infrastructure
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                surface: {
                    1: 'hsl(var(--surface-1))',
                    2: 'hsl(var(--surface-2))',
                    3: 'hsl(var(--surface-3))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                status: {
                    operational: 'hsl(var(--status-operational))',
                    degraded: 'hsl(var(--status-degraded))',
                    warning: 'hsl(var(--status-warning))',
                    critical: 'hsl(var(--status-critical))',
                    info: 'hsl(var(--status-info))',
                },
                border: {
                    default: 'hsl(var(--border-default))',
                    strong: 'hsl(var(--border-strong))',
                },
                confidence: {
                    high: 'hsl(var(--confidence-high))',
                    med: 'hsl(var(--confidence-med))',
                    low: 'hsl(var(--confidence-low))',
                }
            },
            boxShadow: {
                card: 'var(--card-shadow)',
                panel: 'var(--panel-glow)',
            },
            transitionTimingFunction: {
                fast: 'var(--motion-fast)',
                standard: 'var(--motion-standard)',
                slow: 'var(--motion-slow)',
            },
        },
    },
    plugins: [],
} satisfies Config;
