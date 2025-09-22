"use client";

import React, { useState, useMemo } from "react";
import {
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";
import type { JSX } from "react";
import Holidays from "date-holidays";
import { TradeInsert } from "@/components/DiaryClient/TradeForm";

// Initialize US holidays
const hd = new Holidays("US");

interface PnlCalendarProps {
  trades?: TradeInsert[];
}

export function PnlCalendar({ trades = [] }: PnlCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- Group trades by exit_date ---
  const tradesByDate = useMemo(() => {
    const grouped: Record<string, TradeInsert[]> = {};
    trades.forEach((t) => {
      if (t.exit_date) {
        const dateKey = format(parseISO(t.exit_date), "yyyy-MM-dd");
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(t);
      }
    });
    return grouped;
  }, [trades]);

  // --- Holiday map for the current year ---
  const holidayMap = useMemo(() => {
    const holidays = hd.getHolidays(currentMonth.getFullYear());
    const map: Record<string, string> = {};
    holidays.forEach((h) => {
      const isoKey = new Date(h.date).toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      });
      map[isoKey] = h.name; // date → holiday name
    });
    return map;
  }, [currentMonth]);

  // --- Calendar range (always 6 rows = 42 days) ---
  const monthStart = startOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = addDays(startDate, 6 * 7 - 1);

  const rows: JSX.Element[] = [];
  let days: JSX.Element[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dateKey = format(day, "yyyy-MM-dd");
      const isoKey = day.toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      });

      const dayTrades = tradesByDate[dateKey] || [];
      const pnl = dayTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
      const tradeCount = dayTrades.length;
      const holidayName = holidayMap[isoKey];

      // Background color priority: holiday > pnl > default
      let bgColor = "bg-gray-50";
      if (holidayName) {
        bgColor = "bg-white";
      } else if (tradeCount > 0) {
        bgColor = pnl >= 0 ? "bg-green-50" : "bg-red-50";
      }

      days.push(
        <div
          key={day.toString()}
          className={`relative flex flex-col items-center justify-center border rounded-lg text-xs p-1 transition hover:shadow-sm ${bgColor} ${
            !isSameMonth(day, monthStart)
              ? "text-gray-300 bg-white"
              : "text-gray-700"
          }`}
        >
          {/* Day number in top-right */}
          <div className="absolute top-1 right-1 text-[7px] sm:text-[11px] font-medium text-gray-500">
            {format(day, "d")}
          </div>

          {/* Centered trade info */}
          {tradeCount > 0 && (
            <div className="flex flex-col items-center text-center leading-tight">
              <div
                className={`font-semibold text-[10px] ${
                  pnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {pnl >= 0 ? `+${pnl}` : `${pnl}`}
              </div>
              <div className="text-[7px] text-gray-500">
                {tradeCount} {tradeCount > 1 ? "trades" : "trade"}
              </div>
            </div>
          )}

          {/* Holiday label */}
          {holidayName && (
            <div className="flex justify-center items-center text-[7px] break-words font-medium text-center px-1 whitespace-normal max-w-full">
              {holidayName}
            </div>
          )}
        </div>
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div
        className="grid grid-cols-7 gap-2 auto-rows-[50px]"
        key={day.toString()}
      >
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="w-full flex flex-col rounded-lg bg-white border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="px-2 py-1 text-gray-500 hover:text-gray-800"
        >
          ◀
        </button>
        <h2 className="text-base font-semibold text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="px-2 py-1 text-gray-500 hover:text-gray-800"
        >
          ▶
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 py-1 bg-gray-50">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-2 p-2">{rows}</div>
    </div>
  );
}
