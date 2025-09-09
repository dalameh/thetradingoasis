"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Detect desktop vs mobile
  useEffect(() => {
    const updateSize = () => setIsDesktop(window.innerWidth >= 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      {isDesktop && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}

      {/* Mobile hamburger button */}
      {!isDesktop && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
          aria-label="Open menu"
        >
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-gray-800"></span>
            <span className="block w-6 h-0.5 bg-gray-800"></span>
            <span className="block w-6 h-0.5 bg-gray-800"></span>
          </div>
        </button>
      )}

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && !isDesktop &&(
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)} // click outside closes
        >
          <div
            className="absolute left-0 top-0 h-full w-48 bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation(); // prevent overlay click
              setMobileMenuOpen(false); // collapse after any internal click
            }}
          >
            <Sidebar collapsed={false} setCollapsed={() => {}}  />
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className="bg-gray-100 min-h-screen transition-all duration-300"
        style={{
          paddingLeft: isDesktop ? (collapsed ? "5rem" : "12rem") : "0",
        }}
      >
        {children}
      </main>
    </>
  );
}