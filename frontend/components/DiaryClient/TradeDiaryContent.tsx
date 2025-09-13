"use client";

import { useState, Suspense, useEffect } from "react";
import TradeForm from "./TradeForm";
import TradesTable from "./TradesTable";
import { useSearchParams } from 'next/navigation';

export default function TradeDiaryClient() {
  const [trades, setTrades] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

    // const searchParams = useSearchParams();
    // const createParam = searchParams.get('add');
    // const tickerParam = searchParams.get('ticker');
  
    // if add trade is called from watchlist
    // useEffect(() => {
    //   if (createParam === 'true') setIsAdding(true);
    //   // for guests
    //   // const stored = localStorage.getItem('setups');
    //   // if (stored) setSetups(JSON.parse(stored));
    // }, [createParam]);

  // Fetch or initialize trades if needed
  useEffect(() => {
    // Example: fetch trades from backend
    // setTrades(fetchedTrades);
  }, []);


  const handleAddTrade = (trade: any) => {
    setTrades(prev => [...prev, trade]);
    setIsAdding(false);
  };

  const handleCancel = () => setIsAdding(false);

  const stats = (() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl ? Number(t.pnl) : 0), 0);
    return { totalTrades, wins, losses, winRate, totalPnL };
  })();

  return (
    <main>
      <div className="p-4 bg-gray-100 max-w-7xl min-h-screen mx-auto space-y-6">
        {/* Stats */}
        {!isAdding && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {([
              ["Total Trades", stats.totalTrades, "text-blue-600"],
              ["Wins", stats.wins, "text-green-600"],
              ["Losses", stats.losses, "text-red-600"],
              ["Win Rate", `${stats.winRate.toFixed(1)}%`, "text-purple-600"],
              ["Total P&L", `$${stats.totalPnL.toFixed(2)}`, stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"],
            ] as const).map(([label, value, color]) => (
              <div key={label} className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-500">{label}</h3>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Trade Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (isAdding) handleCancel();
              setIsAdding(!isAdding);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isAdding ? "Cancel" : "Add Trade"}
          </button>
        </div>

        {/* Form */}
        {isAdding && <TradeForm onAddTrade={handleAddTrade} handleReturn={handleCancel} />}

        {/* Trades Table */}
        <Suspense fallback={<div className="text-center">Loading trades...</div>}>
          <TradesTable trades={trades} />
        </Suspense>
      </div>
    </main>
  );
}
