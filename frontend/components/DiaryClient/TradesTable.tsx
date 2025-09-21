"use client";

import React, { useState } from "react";
import { TradeInsert } from "./TradeForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

// Format date string (YYYY-MM-DD) from Supabase as EST
function formatDateEST(dateString?: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString + "T00:00:00"); // local parse
  return d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
}

// Format time string (HH:mm or HH:mm AM/PM) from Supabase as EST
function formatTimeEST(timeString?: string | null): string {
  if (!timeString || timeString.trim() === "") return "-";

  const match = timeString.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return "-";

  const [_, hStr, mStr, period] = match;
  let hours = parseInt(hStr);
  const minutes = parseInt(mStr);
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);

  return dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

type TradesTableProps = {
  trades: TradeInsert[];
  onSelectTrade?: (trade: TradeInsert) => void;
  handleDeleteTrade: (id: number) => void;
  loading: boolean;
};

export default function TradesTable({ trades, onSelectTrade, loading, handleDeleteTrade }: TradesTableProps) {
  // Filters
  const [filterSymbol, setFilterSymbol] = useState<string>("");
  const [filterType, setFilterType] = useState<"All" | "Stock" | "Options">("All");
  const [filterEntryDate, setFilterEntryDate] = useState<Date | null>(null);
  const [filterExitDate, setFilterExitDate] = useState<Date | null>(null);
  const [filterRecent, setFilterRecent] = useState<number | null>(null); // 1,3,7,14 days
  const [filterPL, setFilterPL] = useState<[number, number]>([-10000, 10000]);
  const [filterDTE, setFilterDTE] = useState<[number, number]>([0, 365]);
  const [filterPremium, setFilterPremium] = useState<[number, number]>([0, 1000]);
  const [filterContracts, setFilterContracts] = useState<[number, number]>([0, 100]);
  const [filterShares, setFilterShares] = useState<[number, number]>([0, 1000]);
  const [filterSetup, setFilterSetup] = useState<string | null>(null);
  const [filterTotalCost, setFilterTotalCost] = useState<[number, number]>([0, 100000]);
  const [filterActive, setFilterActive] = useState<"All" | "Active" | "Closed">("All");


  // Filtering logic
  const filteredTrades = trades.filter((t) => {
    // Symbol search
    const matchSymbol = t.symbol.toLowerCase().includes(filterSymbol.toLowerCase());

    // Type
    const matchType = filterType === "All" || t.type === filterType;

    // Entry/Exit Date
    const entryDate = t.entry_date ? new Date(t.entry_date + "T00:00:00Z") : null;
    const exitDate = t.exit_date ? new Date(t.exit_date + "T00:00:00Z") : null;
    const matchDate = (() => {
      if (filterEntryDate && !filterExitDate) return entryDate && entryDate.toDateString() === filterEntryDate.toDateString();
      if (!filterEntryDate && filterExitDate) return exitDate && exitDate.toDateString() === filterExitDate.toDateString();
      if (filterEntryDate && filterExitDate) {
        const start = filterEntryDate < filterExitDate ? filterEntryDate : filterExitDate;
        const end = filterEntryDate < filterExitDate ? filterExitDate : filterEntryDate;
        return (
          (entryDate && entryDate >= start && entryDate <= end) ||
          (exitDate && exitDate >= start && exitDate <= end)
        );
      }
      return true;
    })();

    // Recent trades
    if (filterRecent) {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - filterRecent);
      if (entryDate && entryDate < cutoff) return false;
    }

    // P&L
    const pnl = t.pnl ?? 0;
    if (pnl < filterPL[0] || pnl > filterPL[1]) return false;

    // Options-specific
    if (t.type === "Options") {
      if ((t.dte ?? 0) < filterDTE[0] || (t.dte ?? 0) > filterDTE[1]) return false;
      if ((t.entry_premium ?? 0) < filterPremium[0] || (t.entry_premium ?? 0) > filterPremium[1]) return false;
      if ((t.contracts ?? 0) < filterContracts[0] || (t.contracts ?? 0) > filterContracts[1]) return false;
    } else {
      // Stock
      if ((t.shares ?? 0) < filterShares[0] || (t.shares ?? 0) > filterShares[1]) return false;
    }

    // Setup
    if (filterSetup && t.setup !== filterSetup) return false;

    // Total cost
    if ((t.total_cost ?? 0) < filterTotalCost[0] || (t.total_cost ?? 0) > filterTotalCost[1]) return false;

    // Active/Closed
    if (filterActive === "Active" && !t.still_active) return false;
    if (filterActive === "Closed" && t.still_active) return false;

    return matchSymbol && matchType && matchDate;
  });

  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <div className="flex justify-start">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </DialogTrigger>
          <DialogContent
            className="
              sm:max-w-[500px] 
              w-full 
              max-h-[80vh] 
              overflow-y-auto 
              p-6 
              space-y-4 
              text-sm 
              bg-white
              rounded-lg
            "
          >
            <DialogHeader>
              <DialogTitle className="text-base font-medium text-center">Filter Trades</DialogTitle>
            </DialogHeader>

            {/* Symbol Search */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Symbol</label>
              <input
                type="text"
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                placeholder="Search symbol..."
                className="border rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "All" | "Stock" | "Options")}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="All">All</option>
                <option value="Stock">Stock</option>
                <option value="Options">Options</option>
              </select>
            </div>

            {/* Entry/Exit Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Entry Date</label>
                <DatePicker
                  selected={filterEntryDate}
                  onChange={(date) => setFilterEntryDate(date)}
                  placeholderText="Select entry date"
                  isClearable
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Exit Date</label>
                <DatePicker
                  selected={filterExitDate}
                  onChange={(date) => setFilterExitDate(date)}
                  placeholderText="Select exit date"
                  isClearable
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            {/* Recent Trades */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Recent Trades</label>
              <div className="flex items-center gap-2">
                {[1, 3, 7, 14].map((d) => (
                  <Button
                    key={d}
                    variant={filterRecent === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRecent(filterRecent === d ? null : d)}
                  >
                    Last {d} {d === 1 ? "day" : "days"}
                  </Button>
                ))}
              </div>
            </div>

            {/* P&L Slider */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">P&L Range</label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>${filterPL[0]}</span>
                <Slider
                  value={filterPL}
                  min={-10000}
                  max={10000}
                  step={10}
                  onValueChange={(val) => setFilterPL(val as [number, number])}
                  className="flex-1 rounded-full"
                />
                <span>${filterPL[1]}</span>
              </div>
            </div>

            {/* Options or Shares */}
            {filterType === "Options" ? (
              <div className="grid grid-cols-3 gap-4">
                {/* DTE */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-gray-700">DTE</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{filterDTE[0]}</span>
                    <Slider
                      value={filterDTE}
                      min={0}
                      max={365}
                      step={1}
                      onValueChange={(val) => setFilterDTE(val as [number, number])}
                      className="flex-1 rounded-full"
                    />
                    <span>{filterDTE[1]}</span>
                  </div>
                </div>
                {/* Premium */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-gray-700">Premium</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{filterPremium[0]}</span>
                    <Slider
                      value={filterPremium}
                      min={0}
                      max={1000}
                      step={1}
                      onValueChange={(val) => setFilterPremium(val as [number, number])}
                      className="flex-1 rounded-full"
                    />
                    <span>{filterPremium[1]}</span>
                  </div>
                </div>
                {/* Contracts */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-gray-700">Contracts</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{filterContracts[0]}</span>
                    <Slider
                      value={filterContracts}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(val) => setFilterContracts(val as [number, number])}
                      className="flex-1 rounded-full"
                    />
                    <span>{filterContracts[1]}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Shares</label>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{filterShares[0]}</span>
                  <Slider
                    value={filterShares}
                    min={0}
                    max={1000}
                    step={1}
                    onValueChange={(val) => setFilterShares(val as [number, number])}
                    className="flex-1 rounded-full"
                  />
                  <span>{filterShares[1]}</span>
                </div>
              </div>
            )}

            {/* Setup */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Setup</label>
              <select
                value={filterSetup ?? ""}
                onChange={(e) => setFilterSetup(e.target.value || null)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">All</option>
                {[...new Set(trades.map((t) => t.setup))].map((setup) => (
                  <option key={setup} value={setup}>
                    {setup}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Cost */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Total Cost</label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>${filterTotalCost[0]}</span>
                <Slider
                  value={filterTotalCost}
                  min={0}
                  max={100000}
                  step={100}
                  onValueChange={(val) => setFilterTotalCost(val as [number, number])}
                  className="flex-1 rounded-full"
                />
                <span>${filterTotalCost[1]}</span>
              </div>
            </div>

            {/* Active/Closed */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-700">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as "All" | "Active" | "Closed")}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterSymbol("");
                  setFilterType("All");
                  setFilterEntryDate(null);
                  setFilterExitDate(null);
                  setFilterRecent(null);
                  setFilterPL([-10000, 10000]);
                  setFilterDTE([0, 365]);
                  setFilterPremium([0, 1000]);
                  setFilterContracts([0, 100]);
                  setFilterShares([0, 1000]);
                  setFilterSetup(null);
                  setFilterTotalCost([0, 100000]);
                  setFilterActive("All");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </DialogContent>

        </Dialog>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm text-center">
          <thead className="bg-gray-300">
            <tr>
              {["Entry", "Exit", "Symbol", "Type", "Total Cost", "Size", "Stop Loss", "Setup", "P&L", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="text-center">
                    {/* Entry */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-10 mx-auto mt-1 bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Exit */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-10 mx-auto mt-1 bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Symbol */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-14 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Type */}
                    <td className="px-4 py-2">
                      <Badge className="bg-gray-200 text-transparent animate-pulse">---- </Badge>
                    </td>

                    {/* Total Cost */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-20 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Size */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-10 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Stop Loss */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-14 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Setup */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-16 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* P&L */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-12 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2">
                      <div className="h-4 w-12 mx-auto bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              </>           
            ) : !loading && trades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">
                  <div className="text-6xl mb-4">📉</div>
                  <p className="text-lg font-medium">No trades yet</p>
                  <p className="text-sm">Add a trade to get started</p>
                </td>
              </tr>
            ) : !loading && filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-lg font-medium">No trades match filters</p>
                  <p className="text-sm">Try resetting your filters</p>
                </td>
              </tr>
            ) :  (
                filteredTrades.map((t) => {
                  const isOptions = t.type === "Options";
                  const pnlPositive = (t.pnl ?? 0) >= 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-blue-50 transition-colors duration-150 text-center cursor-pointer"
                    >
                      {/* Entry */}
                      <td className="px-4 py-2">
                        {formatDateEST(t.entry_date)}
                        <div className="text-xs text-gray-500">{formatTimeEST(t.entry_time)}</div>
                      </td>

                      {/* Exit */}
                      <td className="px-4 py-2">
                        {t.still_active ? "" : formatDateEST(t.exit_date)}
                        <div className="text-xs">
                          {t.still_active ? (
                            <Badge className="bg-green-100 text-green-500 hover:bg-green-200">Active</Badge>
                          ) : (
                            <span className="text-gray-500">{formatTimeEST(t.exit_time)}</span>
                          )}
                        </div>
                      </td>

                      {/* Symbol */}
                      <td className="px-4 py-2 font-semibold text-gray-800">{t.symbol}</td>

                      {/* Type */}
                      <td className="px-4 py-2">
                        <Badge
                          className={isOptions ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}
                        >
                          {t.type}
                        </Badge>
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-2 text-gray-800">${t.total_cost?.toFixed(2) ?? 0}</td>

                      {/* Size */}
                      <td className="px-4 py-2 text-gray-800">
                        {isOptions ? t.contracts ?? "-" : t.shares ?? "-"}
                      </td>

                      {/* Stop Loss */}
                      <td className="px-4 py-2 text-gray-700">
                        {t.stop_loss ? `${t.stop_loss.toFixed(2)}${t.stop_loss_type}` : "—"}
                      </td>

                      {/* Setup */}
                      <td className="px-4 py-2 text-gray-600">{t.setup || "—"}</td>

                      {/* P&L */}
                      <td className="px-4 py-2 font-semibold">
                        {t.still_active ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        ) : (
                          <span className={pnlPositive ? "text-green-600" : "text-red-600"}>
                            ${t.pnl?.toFixed(2) ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 pt-5 flex items-center justify-center gap-3">
                        <Edit
                          className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800"
                          onClick={() => onSelectTrade?.(t)}
                        />
                        <Trash2
                          className="w-4 h-4 text-red-600 cursor-pointer hover:text-red-800"
                          onClick={() => handleDeleteTrade(t.id)}
                        />
                    </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
