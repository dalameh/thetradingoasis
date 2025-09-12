"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Pages without sidebar
  const hideSidebarPages = ["/", "/signin"];
  const showSidebar = !hideSidebarPages.includes(pathname);

  return (
    <>
      {/* Desktop sidebar (md+) */}
      {showSidebar && (
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
      )}

      {/* Mobile hamburger button */}
      {showSidebar && (
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md shadow-lg bg-gray-200 hover:bg-gray-300"
            aria-label="Open menu"
          >
            <div className="space-y-1">
              <span className="block w-6 h-0.5 bg-gray-800"></span>
              <span className="block w-6 h-0.5 bg-gray-800"></span>
              <span className="block w-6 h-0.5 bg-gray-800"></span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile sidebar drawer */}
      {showSidebar && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)} // clicking overlay closes menu
        >
          <div
            className=""
            onClick={(e) => {
              e.stopPropagation(); // prevent closing when clicking inner container
              setMobileMenuOpen(false); // **close menu on any click inside**
            }}
          >
            <Sidebar collapsed={false} setCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={`bg-gray-100 min-h-screen transition-all duration-300
                    ${showSidebar ? (collapsed ? "md:pl-[5rem]" : "md:pl-[11rem]") : ""}`}
      >
        {children}
      </main>
    </>
  );5
}