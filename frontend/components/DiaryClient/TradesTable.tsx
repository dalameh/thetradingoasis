"use client";

import React from "react";
import {TradeFormData} from './TradeForm';

type TradesTableProps = {
  trades: TradeFormData[];
};

export default function TradesTable({ trades }: TradesTableProps) {
  if (!trades.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-4">📝</div>
        <p>No trades recorded yet</p>
        <p className="text-sm">Start tracking your trades to analyze performance</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Entry",
              "Exit",
              "Symbol",
              "Type",
              "Shares/Contracts",
              "Total Cost",
              "Stop Loss",
              "DTE",
              "Setup",
              "Outcome",
              "P&L",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {trades.map((t) => (
            <tr key={t._id} className="hover:bg-gray-50">
              {/* Entry */}
              <td className="px-4 py-2 whitespace-nowrap">
                {t.entryDate ? new Date(t.entryDate).toLocaleDateString() : "-"}{" "}
                {t.entryTime
                  ? new Date(t.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </td>

              {/* Exit */}
              <td className="px-4 py-2 whitespace-nowrap">
                {t.stillActive
                  ? "Still Active"
                  : `${t.exitDate ? new Date(t.exitDate).toLocaleDateString() : "-"} ${
                      t.exitTime
                        ? new Date(t.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""
                    }`}
              </td>

              {/* Symbol */}
              <td className="px-4 py-2 font-semibold">{t.symbol}</td>

              {/* Type */}
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    t.type === "Options" ? "bg-orange-100 text-black-800" : "bg-blue-100 text-black-800"
                  }`}
                >
                  {t.type.toUpperCase()}
                </span>
              </td>

              {/* Shares / Contracts */}
              <td className="px-4 py-2">{t.type === "Options" ? t.contracts || "-" : t.shares || "-"}</td>

              {/* Total Cost */}
              <td className="px-4 py-2">${t.totalCost ?? 0}</td>

              {/* Stop Loss */}
              <td className="px-4 py-2">{t.stopLoss}{t.stopLossType}</td>

              {/* DTE */}
              <td className="px-4 py-2">{t.type === "Options" ? t.dte || "—" : "—"}</td>

              {/* Setup */}
              <td className="px-4 py-2 text-gray-500">{t.setup || "—"}</td>

              {/* Outcome */}
              <td className="px-4 py-2">
                {t.outcome && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      t.outcome === "win"
                        ? "bg-green-100 text-green-800"
                        : t.outcome === "loss"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {t.outcome.toUpperCase()}
                  </span>
                )}
              </td>

              {/* P&L */}
              <td className="px-4 py-2">
                <span className={t.pnl ?? 0 >= 0 ? "text-green-600" : "text-red-600"}>
                  ${t.pnl ?? 0}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
