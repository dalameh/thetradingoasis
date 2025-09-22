"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { TradeInsert } from "@/components/DiaryClient/TradeForm";

type Timeframe = "2w" | "1m" | "2m";

interface DailyPnlChartProps {
  trades?: TradeInsert[];
}

export default function DailyPnlChart({ trades }: DailyPnlChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("2m");
  const [chartData, setChartData] = useState<{ date: string; pnl: number }[]>(
    []
  );

  useEffect(() => {
    if (!trades) return;

    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "2w":
        startDate.setDate(now.getDate() - 14); // subtract 14 days
        break;
      case "1m":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "2m":
        startDate.setMonth(now.getMonth() - 2);
        break;
    }

    const filteredTrades = trades.filter(
      (t) => t.exit_date && new Date(t.exit_date) >= startDate
    );

    const dailyMap: Record<string, number> = {};
    filteredTrades.forEach((t) => {
      const date = t.exit_date!;
      if (!dailyMap[date]) dailyMap[date] = 0;
      dailyMap[date] += t.pnl ?? 0;
    });

    const dataArray = Object.keys(dailyMap)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({ date, pnl: dailyMap[date] }));

    setChartData(dataArray);
  }, [trades, timeframe]);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Buttons */}
      <div className="flex justify-center gap-1">
         <button
          onClick={() => setTimeframe("2w")}
          className="px-2 py-0.5 text-xs bg-gray-200 rounded active:bg-green-300"
        >
          2 Weeks
        </button>
        <button
          onClick={() => setTimeframe("1m")}
          className="px-2 py-0.5 text-xs bg-gray-200 rounded active:bg-green-300"
        >
          1 Month
        </button>
        <button
          onClick={() => setTimeframe("2m")}
          className="px-2 py-0.5 text-xs bg-gray-200 rounded active:bg-green-300"
        >
          2 Months
        </button>
      </div>
      <div className="flex-1 max-h-[175px] mt-3">
        {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#666", fontFamily: "Inter, sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#666", fontFamily: "Inter, sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={({ payload, active }) => {
                if (active && payload && payload.length) {
                  const pnl = payload[0].value as number;
                  const color = pnl < 0 ? "#F44336" : "#4CAF50";
                  return (
                    <div
                      style={{
                        background: "white",
                        border: "1px solid #ddd",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        color,
                        fontSize: "13px",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      {pnl < 0 ? `-$${Math.abs(pnl).toFixed(2)}` : `$${pnl.toFixed(2)}`}
                    </div>
                  );
                }
                return null;
              }}
              wrapperStyle={{ position: "absolute", zIndex: 9999, pointerEvents: "none" }}

            />

            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl < 0 ? "#F44336" : "#4CAF50"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
      <div className="flex flex-col justify-center items-center text-gray-500 h-[100px]">
        <span className = "text-4xl mb-2">📊</span>
        <p className="text-sm">No closed trades yet.</p>
        <p className="text-xs">Enter trades and close them to see your daily PnL chart.</p>
      </div>
      )}
      </div>
    </div>
  );
}