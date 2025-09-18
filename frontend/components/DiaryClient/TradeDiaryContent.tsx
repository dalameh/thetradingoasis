"use client";

import { useState, Suspense, useEffect } from "react";
import TradeForm from "./TradeForm";
import TradesTable from "./TradesTable";
import { useSearchParams } from 'next/navigation';
import {TradeInsert } from './TradeForm';
import { supabase } from '@/lib/supabaseFrontendClient';
import {toast} from 'sonner';

export default function TradeDiaryClient() {
  const [trades, setTrades] = useState<TradeInsert[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeInsert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Open form when row is clicked
  const handleSelectTrade = (trade: TradeInsert) => {
    setSelectedTrade(trade);
    setIsAdding(true);
  };

  const handleDeleteTrade = async (id: number) => {
    const isGuest = sessionStorage.getItem("authenticated") === "guest";
    const guestId = sessionStorage.getItem("guestId");

    if (isGuest && guestId) {
      // Guest trade: remove from sessionStorage
      const storedTrades = JSON.parse(sessionStorage.getItem("trades") || "[]");
      const updatedTrades = storedTrades.filter((t: TradeInsert) => t.id !== id);
      sessionStorage.setItem("trades", JSON.stringify(updatedTrades));
      setTrades(updatedTrades);
      toast.success("Guest trade deleted successfully");
    } else {
      // Logged-in user trade: delete from Supabase
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) {
        console.error("Error deleting trade:", error);
        toast.error("Failed to delete trade");
      } else {
        setTrades((prevTrades) => prevTrades.filter((t) => t.id !== id));
        toast.success("Trade deleted successfully");
      }
    }
  };

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

 useEffect(() => {
  const fetchTrades = async () => {
    setLoading(true);

    let fetchedTrades: TradeInsert[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.warn("No logged in user, will check guest trades:", userError.message);
      }

      if (user) {
        // Logged-in user: fetch from Supabase
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching trades:", error);
        } else if (data) {
          fetchedTrades = data;
        }
      } else {
        // No user: fallback to guest trades
        const guestTrades = JSON.parse(sessionStorage.getItem("trades") || "[]");
        fetchedTrades = guestTrades;
      }
    } catch (err) {
      console.error("Unexpected error fetching trades:", err);
      // fallback to guest trades
      const guestTrades = JSON.parse(sessionStorage.getItem("trades") || "[]");
      fetchedTrades = guestTrades;
    }

    setTrades(fetchedTrades);
    setLoading(false);
  };

  fetchTrades();
}, []);


  const handleAddTrade = (trade: TradeInsert) => {

    setTrades((prev) => {
      if (!selectedTrade) {
        // if no selectedtrade just append
        return [...prev, trade];
      }
      // check if trade with this id exists
      const exists = prev.some(t => t.id === trade.id);
      if (exists) {
        // replace the existing trade
        return prev.map(t => (t.id === trade.id ? trade : t));
      } else {
        // shouldnt hit but just in case
        // new trade, append
        return [...prev, trade];
      }
    });

    setIsAdding(false);
    setSelectedTrade(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setSelectedTrade(null);
  }

  const stats = (() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;
    const closed = trades.filter((t) => t.still_active === false).length
    const winRate = totalTrades > 0 && closed ? (wins / closed) * 100 : 0;
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
        {isAdding && <TradeForm onAddTrade={handleAddTrade} handleReturn={handleCancel} trade={selectedTrade} />}

        {/* Trades Table */}
        <Suspense fallback={<div className="text-center">Loading trades...</div>}>
          <TradesTable trades={trades} onSelectTrade={handleSelectTrade} handleDeleteTrade = {handleDeleteTrade} loading = {loading} />
        </Suspense>
      </div>
    </main>
  );
}
