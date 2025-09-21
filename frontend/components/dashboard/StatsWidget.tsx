"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { AVAILABLE_WIDGETS } from "@/components/dashboard/availableWidget";
import { TradeInsert } from "@/components/DiaryClient/TradeForm";

interface StatWidgetProps {
  widgetId: string;
  trades?: TradeInsert[];
}

export function StatsWidget({ widgetId, trades = [] }: StatWidgetProps) {
  // total trades includes active trades
  const totalTrades = trades.length;

  // closedTrades: exclude active trades from all metrics except totalTrades.
  const closedTrades = trades.filter((t) => !!t.exit_date);

  // Summed pnl for closed trades
  const totalPnL = closedTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const positivePnL = closedTrades.reduce(
    (acc, t) => acc + Math.max(0, t.pnl ?? 0),
    0
  );
  const negativePnL = closedTrades.reduce(
    (acc, t) => acc + Math.max(0, -(t.pnl ?? 0)),
    0
  );

  // Average PnL (dollars) for closed trades
  const avgPnl =
    closedTrades.length > 0
      ? totalPnL / closedTrades.length
      : 0;

  // Win/Loss/Breakeven counts
  const wins = closedTrades.filter((t) => t.outcome === "win").length;
  const losses = closedTrades.filter((t) => t.outcome === "loss").length;
  const breakeven = closedTrades.filter((t) => t.outcome === "breakeven").length;
  const closedCount = closedTrades.length;
  const winRate = closedCount > 0 ? ((wins / closedCount) * 100).toFixed(2) : "0";

  // Formatter helpers
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);

  // --- PROFIT FACTOR ---
  if (widgetId === "profit-factor") {
    const data = [
      { name: "Profit", value: positivePnL },
      { name: "Loss", value: negativePnL },
    ];
    return (
      <div className="flex justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1">Profit Factor</div>
          <div className="text-lg font-semibold text-gray-900">
            {negativePnL > 0 ? (positivePnL / negativePnL).toFixed(2) : "∞"}
          </div>
        </div>
        <div className="w-25 h-25">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={28}
                outerRadius={36}
                startAngle={180}
                endAngle={0}
                paddingAngle={2}
                isAnimationActive={false}
              >
                <Cell key="profit" fill="#4CAF50" />
                <Cell key="loss" fill="#F44336" />
              </Pie>
              <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // --- NET PNL ---
  if (widgetId === "net-pnl") {
    const data = [
      { name: "Profit", value: positivePnL },
      { name: "Loss", value: negativePnL },
    ];
    return (
      <div className="flex justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1">Net PnL</div>
          <div className={`text-lg font-semibold text-black`}>
            {fmtCurrency(totalPnL)}
          </div>
        </div>
        <div className="w-25 h-25">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={28}
                outerRadius={36}
                startAngle={180}
                endAngle={0}
                paddingAngle={2}
                isAnimationActive={false}
              >
                <Cell key="profit" fill="#4CAF50" />
                <Cell key="loss" fill="#F44336" />
              </Pie>
              <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // --- WIN RATE ---
  if (widgetId === "win-rate") {
    const data = [
      { name: "Wins", value: wins },
      { name: "Losses", value: losses },
      { name: "Breakeven", value: breakeven },
    ];
    return (
      <div className="flex justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1">Win %</div>
          <div className="text-lg font-semibold text-gray-900">{winRate}%</div>
        </div>
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={28}
                outerRadius={36}
                paddingAngle={2}
                isAnimationActive={false}
              >
                <Cell key="wins" fill="#4CAF50" />
                <Cell key="losses" fill="#F44336" />
                <Cell key="breakeven" fill="#2196F3" />
              </Pie>
              <RechartsTooltip
                content={({ payload, active }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0];
                    return (
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #ddd",
                          padding: 6,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div>{p.value}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // --- AVERAGE PNL RETURN ---
  if (widgetId === "avg-pnl-return") {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1">Avg PnL</div>
          <div className="text-lg font-semibold text-gray-900">
            {fmtCurrency(avgPnl)}
          </div>
        </div>
      </div>
    );
  }

  // --- TOTAL TRADES ---
  if (widgetId === "total-trades") {
    const activeCount = totalTrades - closedCount;
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1">Total Trades</div>
          <div className="text-lg font-semibold text-gray-900">{totalTrades}</div>
          <div className="text-xs text-gray-400">
            Active: {activeCount} • Closed: {closedCount}
          </div>
        </div>
      </div>
    );
  }

  // fallback
  const meta = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
  return (
    <div className="flex flex-col">
      <div className="text-xs font-medium text-gray-500">{meta?.title}</div>
      <div className="text-lg font-semibold text-gray-900">
        {meta?.description}
      </div>
    </div>
  );
}
