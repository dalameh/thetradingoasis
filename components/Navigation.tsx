// Navigation.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseFrontendClient"; // adjust path to your supabase client

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
  // currently the sign out but making it account icon for now
  { id: "signout", label: "Sign Out", icon: <AccountIcon />, href: "/" },
];

export default function Navigation({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/"); // Redirect after sign out
    } else {
      alert("Failed to sign out: " + error.message);
    }
  }

  return (
    <nav className="flex flex-col transform scale-95 h-full space-y-3 w-full">
      {pages
        .filter((item) => item.id !== "signout")
        .map(({ id, label, icon, href }) => {
          const isActive = href !== "/" && pathname.startsWith(href);

          return (
            <button
              key={id}
              onClick={() => router.push(href)}
              className={`flex items-center ${
                collapsed ? "justify-center" : "space-x-4 space-y-0.5"
              } px-4 py-1 rounded-md text-sm font-serif cursor-pointer
                ${
                  isActive
                    ? "bg-blue-200 text-blue-800"
                    // : "text-gray-600 hover:text-primary active:bg-blue-200"
                    : "text-cyan-50 hover:text-primary active:bg-blue-200"
                }
                ${id === "signout" ? "border shadow-md" : ""}`}
            >
              <span>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}

      <div className="flex-grow"></div>

      {/* Bottom nav item: signout/account */}
      {pages
        .filter((item) => item.id === "signout")
        .map(({ id, label, icon }) => {
          const isActive = false; // signout typically not "active"

          return (
            <button
              key={id}
              onClick={handleSignOut} // <-- call signOut handler here
              className={`flex items-center ${
                collapsed ? "justify-center" : "space-x-2"
              } px-4 py-2 rounded-md text-sm font-medium cursor-pointer border shadow-mds
                ${
                  isActive
                    ? "bg-blue-200 text-blue-800"
                    : "text-gray-600 hover:text-primary active:bg-blue-200"
                }`}
            >
              <span>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
    </nav>
  );
}