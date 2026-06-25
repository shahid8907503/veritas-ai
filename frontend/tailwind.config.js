/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        ctp: {
          rosewater: '#f5e0dc',
          flamingo: '#f2cdcd',
          pink: '#f5c2e7',
          mauve: '#cba6f7',
          red: '#f38ba8',
          maroon: '#eba0ac',
          peach: '#fab387',
          yellow: '#f9e2af',
          green: '#a6e3a1',
          teal: '#94e2d5',
          sky: '#89dceb',
          sapphire: '#74c7ec',
          blue: '#89b4fa',
          lavender: '#b4befe',
          text: '#cdd6f4',
          subtext1: '#bac2de',
          subtext0: '#a6adc8',
          overlay2: '#9399b2',
          overlay1: '#7f849c',
          overlay0: '#6c7086',
          surface2: '#585b70',
          surface1: '#45475a',
          surface0: '#313244',
          base: '#1e1e2e',
          mantle: '#181825',
          crust: '#11111b',
        },
        rdx: {
          indigo: {
            1: '#0f111a',
            2: '#121626',
            3: '#182245',
            4: '#1c2b5e',
            5: '#223777',
            6: '#2b4596',
            7: '#3957bf',
            8: '#4c6fe6',
            9: '#6366f1',
            10: '#7b7ff3',
            11: '#a0a3f6',
            12: '#e0e2fe',
          },
          cyan: {
            1: '#091217',
            2: '#0c1a24',
            3: '#112a3d',
            4: '#133954',
            5: '#184b6d',
            6: '#1f5e88',
            7: '#2874a7',
            8: '#348ec7',
            9: '#22d3ee',
            10: '#42e1f6',
            11: '#77eefa',
            12: '#e1fbfd',
          }
        },
        cyber: {
          dark: '#0a0b10',
          card: 'rgba(17, 19, 29, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f1f5f9',
          muted: '#94a3b8',
          accent: '#6366f1',
          
          // Authenticity Categories
          real: '#10b981',       // emerald-500
          fake: '#ef4444',       // red-500
          misleading: '#f59e0b', // amber-500
          clickbait: '#8b5cf6',  // violet-500
          propaganda: '#ec4899', // pink-500
          satire: '#06b6d4'      // cyan-500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-highlight': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
