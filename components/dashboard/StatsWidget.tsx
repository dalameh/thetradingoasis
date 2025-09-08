// components/dashboard/StatsWidget.tsx
'use client';

import React from "react";
import { AVAILABLE_WIDGETS } from "@/components/dashboard/availableWidget";

export interface Stat {
  id: string;
  title: string;
  value: string;
  change?: string;
  changePercent?: string;
  trend?: "up" | "down" | "flat";
}

// Small set of initial stat values (you can wire this to real data later)
export const INITIAL_STATS: Stat[] = [
  { id: "net-pl", title: "Net P&L", value: "$12,450.32", change: "+$1,234.56", changePercent: "11.0%", trend: "up" },
  { id: "win-rate", title: "Win Rate", value: "68.5%", change: "+2.1%", changePercent: "3.2%", trend: "up" },
  { id: "volume-traded", title: "Volume Traded", value: "1,234", change: "+120", changePercent: "10.8%", trend: "up" },
  { id: "total-trades", title: "Total Trades", value: "20", change: "+3", changePercent: "11.0%", trend: "up" },

];

export function StatsWidget({ widgetId }: { widgetId: string }) {
  const stat = INITIAL_STATS.find(s => s.id === widgetId);

  // If this is not one of the small stats, fallback to AVAILABLE_WIDGETS entry
  if (!stat) {
    const meta = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    return (
      <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500">{meta?.title}</div>
        <div className="text-lg font-semibold text-gray-900">{meta?.description}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium text-gray-500">{stat.title}</div>
        <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
      </div>
      <div className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-gray-500"}`}>
        <div>{stat.change}</div>
        <div className="text-xs text-gray-400">{stat.changePercent}</div>
      </div>
    </div>
  );
}
