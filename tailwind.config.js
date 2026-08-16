/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        wa: {
          tealDark: '#075e54',
          teal: '#128c7e',
          green: '#25d366',
          header: '#00a884',
          headerHover: '#00c49a',
          chatBg: '#0b141a',
          sent: '#005c4b',
          received: '#202c33',
          panel: '#111b21',
          panelAlt: '#0b141a',
          panelHeader: '#202c33',
          border: '#2a3942',
          textPrimary: '#e9edef',
          textSecondary: '#8696a0',
          tick: '#53bdeb',
          cardBg: '#182229',
          cardHover: '#1f2c33',
          glow: 'rgba(0, 168, 132, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        bubble: '0 1px 2px rgba(0,0,0,0.3)',
        panel: '0 2px 16px rgba(0,0,0,0.25)',
        glow: '0 0 20px rgba(0, 168, 132, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 168, 132, 0.2)',
        card: '0 4px 20px rgba(0,0,0,0.2), 0 0 1px rgba(0, 168, 132, 0.1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00a884, #008069)',
        'gradient-accent': 'linear-gradient(135deg, #25d366, #00a884)',
        'gradient-dark': 'linear-gradient(145deg, #182229, #111b21)',
        'gradient-card': 'linear-gradient(135deg, rgba(32, 44, 51, 0.9), rgba(24, 34, 41, 0.95))',
      },
    },
  },
  plugins: [],
};
