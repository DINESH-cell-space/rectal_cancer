/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        biolens: {
          950: '#050811', // Deepest midnight void
          900: '#090E1D', // Dark cinematic background
          850: '#0D152A', // Panel elevated surface
          800: '#131F3B', // Border surface
          700: '#1D2D54',
          cyan: '#06B6D4', // Primary electric cyan
          'cyan-bright': '#22D3EE',
          violet: '#8B5CF6', // Primary electric violet
          'violet-bright': '#A78BFA',
          magenta: '#EC4899', // Attention highlight
          emerald: '#10B981', // Normal/benign
          amber: '#F59E0B',   // Warning/intermediate
          rose: '#F43F5E',    // High-malignancy
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
        'glow-mixed': '0 0 25px -4px rgba(6, 182, 212, 0.25), 0 0 25px -4px rgba(139, 92, 246, 0.25)',
        'panel-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'futuristic-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.1), transparent 60%)',
        'grid-pattern': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
