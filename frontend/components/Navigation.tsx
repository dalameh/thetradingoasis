// Navigation.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseFrontendClient";

const AccountIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className="w-5 h-5"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
  </svg>
);

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
  { id: "charts", label: "Charts", icon: "📈", href: "/charts" },
  { id: "news", label: "Headlines", icon: "📰", href: "/news" },
  { id: "watchlist", label: "Watchlist", icon: "👁️", href: "/watchlist" },
  { id: "predictions", label: "Predictions", icon: "🔮", href: "/predictions" },
  { id: "scans", label: "Scans", icon: "🔍", href: "/scans" },
  { id: "diary", label: "Trade Diary", icon: "📝", href: "/diary" },
  { id: "playbook", label: "Playbook", icon: "💼", href: "/playbook" },
  { id: "signout", label: "Sign Out", icon: <AccountIcon />, href: "/" },
];

export default function Navigation({
  collapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isGuest, setIsGuest] = useState(false);

  // Detect guest mode once client is mounted
  useEffect(() => {
    setIsGuest(sessionStorage.getItem("authenticated") === "guest");
  }, []);

  async function handleSignOut() {
    if (isGuest) {
      // Guest: just return to landing
      router.push("/");
    } else {
      // Supabase user sign out
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.push("/");
      } else {
        alert("Failed to sign out: " + error.message);
      }
    }
  }

  return (
    <nav className="flex flex-col justify-between h-full space-y-3 transform scale-95">

      {/* Main navigation items */}
      <div className="flex flex-col space-y-2">
        {pages
          .filter((item) => item.id !== "signout")
          .map(({ id, label, icon, href }) => {
            const isActive = href !== "/" && pathname.startsWith(href);

            return (
              <button
                key={id}
                onClick={() => router.push(href)}
                className={`
                  flex items-center px-4 py-2 rounded-md text-sm font-serif cursor-pointer
                  transition-all duration-300
                  ${collapsed ? "justify-center" : "justify-start space-x-3"}
                  ${
                    isActive
                      ? "transform scale-105 bg-gradient-to-r from-blue-500 to-amber-400 text-slate-800 font-stretch-50% shadow-md"
                      : "text-cyan-100 hover:text-slate-800 hover:bg-gradient-to-r hover:from-blue-400 hover:to-amber-400"
                  }
                `}
              >
                {/* Icon wrapper */}
                <span className="flex-shrink-0 ml-2.5 flex items-center justify-center">
                  {icon}
                </span>

                {/* Text with smooth expand/collapse */}
                <span
                  className={`
                    ml-2 inline-block overflow-hidden whitespace-nowrap
                    transition-[max-width,opacity] duration-300 ease-in-out
                    ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}
                  `}
                >
                  {label}
                </span>
              </button>
            );
          })}
      </div>

      {/* Bottom nav item: Sign Out / Account */}
      <div>
        {pages
          .filter((item) => item.id === "signout")
          .map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={handleSignOut}
              className={`
                flex items-center px-3 py-1 rounded-md text-sm font-medium cursor-pointer border shadow-mds
                transition-all duration-300
                ${collapsed ? "justify-center" : "justify-start space-x-3"}
                text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500
                active:bg-gradient-to-r active:from-red-600 active:to-pink-600
              `}
            >
              {/* Icon wrapper */}
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center ml-1.5 rounded-full border border-gray-700 text-white">
                {icon}
              </span>

              {/* Text with smooth expand/collapse */}
              <span
                className={`
                  inline-block overflow-hidden whitespace-nowrap
                  transition-[max-width,opacity] duration-300 ease-in-out
                  ${collapsed ? "ml-1.5 max-w-0 opacity-0" : "max-w-[200px] opacity-100"}
                `}
              >
                {isGuest ? "Exit Guest Mode" : label}
              </span>
            </button>
          ))}
      </div>
    </nav>
  );
}