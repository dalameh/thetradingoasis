// // Navigation.tsx
// "use client";

// import { useRouter, usePathname } from "next/navigation";
// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseFrontendClient";

// const AccountIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     viewBox="0 0 24 24"
//     className="w-5 h-5"
//   >
//     <circle cx="12" cy="7" r="4" />
//     <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
//   </svg>
// );

// const pages = [
//   { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
//   { id: "charts", label: "Charts", icon: "📈", href: "/charts" },
//   { id: "news", label: "Headlines", icon: "📰", href: "/news" },
//   { id: "watchlist", label: "Watchlist", icon: "👁️", href: "/watchlist" },
//   { id: "predictions", label: "Predictions", icon: "🔮", href: "/predictions" },
//   { id: "scans", label: "Scans", icon: "🔍", href: "/scans" },
//   { id: "diary", label: "Trade Diary", icon: "📝", href: "/diary" },
//   { id: "playbook", label: "Playbook", icon: "💼", href: "/playbook" },
//   { id: "settings", label: "Settings", icon: <AccountIcon />, href: "/settings" },
// ];

// export default function Navigation({
//   collapsed,
// }: {
//   collapsed: boolean;
//   setCollapsed: (value: boolean) => void;
// }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isGuest, setIsGuest] = useState(false);

//   // Detect guest mode once client is mounted
//   useEffect(() => {
//     setIsGuest(sessionStorage.getItem("authenticated") === "guest");
//   }, []);

//   async function handleSignOut() {
//     if (isGuest) {
//       // Guest: just return to landing
//       router.push("/");
//     } else {
//       // Supabase user sign out
//       const { error } = await supabase.auth.signOut();
//       if (!error) {
//         router.push("/");
//       } else {
//         alert("Failed to sign out: " + error.message);
//       }
//     }
//   }

//   return (
   
//   );
// }