// /** @type {import('tailwindcss').Config} */
// const config = {
//   darkMode: ["class"], // Enable class-based dark mode
//   content: [
//     "./app/**/*.{ts,tsx}",
//     "./pages/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "./src/**/*.{ts,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         debugPink: "#ff00ff",
//         // Core
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",

//         // Cards & popovers
//         card: {
//           DEFAULT: "hsl(var(--card-background))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover-background))",
//           foreground: "hsl(var(--popover-foreground))",
//         },

//         // Semantic colors
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           hover: "hsl(var(--primary-hover))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         success: {
//           DEFAULT: "hsl(var(--success))",
//           foreground: "hsl(var(--success-foreground))",
//         },
//         danger: {
//           DEFAULT: "hsl(var(--danger))",
//           foreground: "hsl(var(--danger-foreground))",
//         },
//         warning: {
//           DEFAULT: "hsl(var(--warning))",
//           foreground: "hsl(var(--warning-foreground))",
//         },
//         info: {
//           DEFAULT: "hsl(var(--info))",
//           foreground: "hsl(var(--info-foreground))",
//         },

//         // Sidebar
//         sidebar: {
//           background: "hsl(var(--sidebar-background))",
//           foreground: "hsl(var(--sidebar-foreground))",
//           primary: "hsl(var(--sidebar-primary))",
//           primaryForeground: "hsl(var(--sidebar-primary-foreground))",
//           accent: "hsl(var(--sidebar-accent))",
//           accentForeground: "hsl(var(--sidebar-accent-foreground))",
//           border: "hsl(var(--sidebar-border))",
//           ring: "hsl(var(--sidebar-ring))",
//         },
//       },

//       borderRadius: {
//         lg: "var(--radius)",
//       },

//       backgroundImage: {
//         "gradient-success": "linear-gradient(135deg, hsl(var(--success)), hsl(var(--success-foreground)))",
//         "gradient-danger": "linear-gradient(135deg, hsl(var(--danger)), hsl(var(--danger-foreground)))",
//         "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))",
//         "gradient-card": "linear-gradient(145deg, hsl(var(--card-background)), hsl(var(--card-foreground)))",
//       },

//       keyframes: {
//         "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
//         "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
//         "spin-reverse": { from: { transform: "rotate(360deg)" }, to: { transform: "rotate(0deg)" } },
//       },

//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//         "spin-reverse": "spin-reverse 1s linear infinite",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// };

// module.exports = config;
