/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF7ED", 100: "#FFEDD5", 200: "#FED7AA", 300: "#FDBA74",
          400: "#FB923C", 500: "#F97316", 600: "#EA580C", 700: "#C2410C",
          800: "#9A3412", 900: "#7C2D12",
        },
        secondary: {
          50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
          400: "#34D399", 500: "#10B981", 600: "#059669",
        },
        warm: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
          400: "#FBBF24", 500: "#F59E0B",
        },
        neutral: {
          50: "#FAFAF9", 100: "#F5F5F4", 200: "#E7E5E4", 300: "#D6D3D1",
          400: "#A8A29E", 500: "#78716C", 600: "#57534E", 700: "#44403C",
          800: "#292524", 900: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["Inter"],
        display: ["Outfit"],
      },
    },
  },
  plugins: [],
};
