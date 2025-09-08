"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar"; // your sidebar component

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`bg-gray-100 min-h-screen transition-all duration-300 ${
          collapsed ? "pl-20" : "pl-47"
        }`}
      >
        {children}
      </main>
    </>
  );
}
