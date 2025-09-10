"use client";

import React, { useEffect, useState, useRef } from "react";
import Navigation from "./Navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseFrontendClient";

export default function Sidebar({
  collapsed = true,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);
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

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-gradient-to-tr from-gray-800 via-slate-900 to-cyan-900
        shadow-lg z-50
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-48"}
        flex flex-col items-center py-2 px-2
        overflow-hidden
      `}
      style={{ userSelect: dragging.current ? "none" : "auto" }}
    >
      {/* Logo */}
      <button
        onClick={handeIconButton}
        className="focus:outline-none w-full flex justify-center"
        aria-label="Toggle sidebar"
      >
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ width: collapsed ? 50 : 120 }}
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
      <div className="relative w-full flex flex-col items-center h-30 mt-1 mb-5">
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

        <div
          className={`
            absolute top-0 left-0 w-full flex flex-col items-center
            transition-all duration-500 ease-in-out transform origin-top
            ${collapsed ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
          `}
        >
          {["O", "A", "S", "I", "S"].map((letter, i) => (
            <h1 key={i} className="text-sm font-semibold text-white mb-1 leading-4">
              {letter}
            </h1>
          ))}
        </div>
      </div>

      {/* Navigation menu */}
      {authenticated && <Navigation collapsed={collapsed} setCollapsed={setCollapsed} />}

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
        aria-label="Resize sidebar"
      />
    </aside>
  );
}