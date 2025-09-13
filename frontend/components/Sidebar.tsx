"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseFrontendClient";
import { useRouter, usePathname } from "next/navigation";


export default function Sidebar({
  collapsed = true,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const dragging = useRef(false);
  const startX = useRef(0);
  const dragThreshold = 30; // pixels to decide toggle
  
  useEffect(() => {
    let mounted = true;

    // Check Supabase session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        setAuthenticated(true);
      } else if (mounted) {
        // Check guest mode from sessionStorage
        const guestMode = sessionStorage.getItem("authenticated") === "guest";
        setAuthenticated(guestMode);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setAuthenticated(true);
      if (event === "SIGNED_OUT") {
        const guestMode = sessionStorage.getItem("authenticated") === "guest";
        setAuthenticated(guestMode);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Mouse move handler
  function onMouseMove(e: MouseEvent) {
    if (!dragging.current) return;
    const deltaX = e.clientX - startX.current;

    if (deltaX < -dragThreshold && !collapsed) {
      setCollapsed(true);
      dragging.current = false;
    } else if (deltaX > dragThreshold && collapsed) {
      setCollapsed(false);
      dragging.current = false;
    }
  }

  function onMouseUp() {
    dragging.current = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function handeIconButton() {
    setCollapsed(!collapsed);
  }

  const pages = [
    { id: "dashboard", label: "Dashboard", icon: "📊", href: "/dashboard" },
    { id: "charts", label: "Charts", icon: "📈", href: "/charts" },
    { id: "news", label: "Headlines", icon: "📰", href: "/news" },
    { id: "watchlist", label: "Watchlist", icon: "👁️", href: "/watchlist" },
    { id: "predictions", label: "Predictions", icon: "🔮", href: "/predictions" },
    { id: "scans", label: "Scans", icon: "🔍", href: "/scans" },
    { id: "diary", label: "Trade Diary", icon: "📝", href: "/diary" },
    { id: "playbook", label: "Playbook", icon: "💼", href: "/playbook" },
    { id: "settings", label: "Settings", icon: "⚙️", href: "/settings" },
  ];

  return (
    <aside
      className="
        fixed top-0 left-0 h-screen
        bg-gradient-to-tr from-gray-800 via-slate-900 to-cyan-900
        rounded-r-2xl
        shadow-[8px_8px_20px_rgba(0,0,0,.75)]
        z-50 flex flex-col
        overflow-hidden transition-[width] duration-300 ease-in-out
      "
      style={{
        width: collapsed ? "5rem" : "11rem",
        userSelect: dragging.current ? "none" : "auto",
      }}
    >
      {/* Logo */}
      <button
        onClick={handeIconButton}
        className="focus:outline-none w-full flex justify-center flex-none"
        aria-label="Toggle sidebar"
      >
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out mt-2"
          style={{ width: collapsed ? 50 : 110 }}
        >
          <Image
            src="/favicon.ico"
            alt="Trading Oasis Icon"
            width={120}
            height={40}
            className="select-none mx-auto transition-transform duration-500 ease-in-out"
          />
        </div>
      </button>

      {/* Header */}
      <div className="relative w-full flex flex-col items-center flex-none">
        {/* Header */}
        <div className="relative w-full flex flex-col items-center h-15">
          {/* Expanded title */}
          <div
            className={`
              absolute top-0 left-0 w-full flex flex-col items-center
              transition-all duration-500 ease-in-out transform origin-top
              ${collapsed ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}
            `}
          >
            <h1 className="text-lg text-white font-semibold font-serif leading-tight">The</h1>
            <h1 className="text-xl text-white font-bold font-serif leading-tight">Trading Oasis</h1>
          </div>

          {/* Collapsed title */}
          <div
            className={`
              absolute top-0 left-0 w-full flex flex-col items-center mt-1
              transition-all duration-500 ease-in-out transform origin-top
              ${collapsed ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
            `}
          >
            {["O", "A", "S", "I", "S"].map((letter, i) => (
              <h1 key={i} className="text-sm font-semibold text-white leading-4 py-0.5">
                {letter}
              </h1>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      {authenticated && (
        <nav className={`flex-1 overflow-y-auto px-2.5 ${collapsed ? "mt-15": ""}`}>
          <div className="flex flex-col space-y-1">
            {pages.map(({ id, label, icon, href }) => {
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
                        ? "transform scale-105 bg-gradient-to-r from-blue-500 to-amber-400 text-slate-800 shadow-md"
                        : "text-cyan-100 hover:text-slate-800 hover:bg-gradient-to-r hover:from-blue-400 hover:to-amber-400"
                    }
                  `}
                >
                  <span className="flex-shrink-0 ml-2 flex items-center justify-center">{icon}</span>
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
        </nav>
      )}

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
        aria-label="Resize sidebar"
      />
    </aside>
  );
}