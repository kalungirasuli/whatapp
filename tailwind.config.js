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
          header: '#008069',
          headerHover: '#017561',
          chatBg: '#efeae2',
          sent: '#d9fdd3',
          received: '#ffffff',
          panel: '#ffffff',
          panelAlt: '#f0f2f5',
          border: '#e9edef',
          textPrimary: '#111b21',
          textSecondary: '#667781',
          tick: '#53bdeb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        bubble: '0 1px 0.5px rgba(11,20,26,0.13)',
        panel: '0 2px 12px rgba(11,20,26,0.08)',
      },
    },
  },
  plugins: [],
};
