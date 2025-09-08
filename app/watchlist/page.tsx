'use client';

import React, { useState, useMemo } from 'react';
import { useWatchlistStore, Ticker } from '@/store/WatchlistStore';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import {isTradingDay, getESTDate } from '@/store/WatchlistStore'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, BarChart3, Newspaper, NotebookPen, Trash2 , Plus} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, loading, addTicker, removeTicker } = useWatchlistStore();

  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<'ticker'|'price'|'changePct'>('ticker');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const sorted = useMemo(() => {
    return [...watchlist].sort((a, b) => {
      let comp = 0;
      if (sortKey === 'ticker') comp = a.ticker.localeCompare(b.ticker);
      else if (sortKey === 'price') comp = a.price - b.price;
      else if (sortKey === 'changePct') comp = a.changePct - b.changePct;
      return sortDir === 'asc' ? comp : -comp;
    });
  }, [watchlist, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage]);

  // Summary
  const cumPercent = watchlist.reduce((a,b)=>a+b.changePct,0);
  let topGainer: string | null = null, topLoser: string | null = null;
  let maxChange = -Infinity, minChange = Infinity;
  for (const t of watchlist) {
    if (t.changePct > maxChange && t.changePct > 0) { maxChange = t.changePct; topGainer = t.ticker; }
    if (t.changePct < minChange && t.changePct < 0) { minChange = t.changePct; topLoser = t.ticker; }
  }

  const marketTime = (() => {
    const now = new Date();
    const estNow = getESTDate(now); // correct EST Date

    const marketOpen = new Date(estNow);
    marketOpen.setHours(9, 30, 0, 0);

    const marketClose = new Date(estNow);
    marketClose.setHours(16, 0, 0, 0);

    const marketPreStart = new Date(estNow);
    marketPreStart.setHours(4, 0, 0, 0);

    const marketPostClose = new Date(estNow);
    marketPostClose.setHours(20, 0, 0, 0);

    const tradingDay = isTradingDay(estNow); // now correctly uses EST
    console.log(tradingDay);

    let time: string;
    if (!tradingDay) {
      time = "Market Closed";
    } else if (estNow >= marketOpen && estNow < marketClose) {
      time = "Market Open";
    } else if (estNow >= marketClose && estNow < marketPostClose) {
      time = "Post-Market";
    } else if (estNow >= marketPostClose || estNow <= marketPreStart) {
      time = "Market Closed";
    } else if (estNow >= marketPreStart && estNow < marketOpen) {
      time = "Pre-Market";
    } else {
      time = "unknown";
    }

    // You need this:
    return time;
  })();

     
   // Combined sparkline (overall)
    const overallSparkline = useMemo(() => {
      if (!watchlist.length) return [];

      // Step 1: compute summed percent change at each index
      const summedPctChanges = watchlist[0].sparkline.map((_, i) => {
        return watchlist.reduce((acc, t) => {
          const base = t.sparkline[0] || 1; // first value of this ticker
          const current = t.sparkline[i] ?? base;
          const pctChange = ((current / base) - 1) * 100;
          return acc + pctChange; // sum instead of average
        }, 0);
      });

    // Step 2: normalize into "index" form starting at 100
    return summedPctChanges.map(pct => 100 * (1 + pct / 100));
  }, [watchlist]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addTicker(input.trim().toUpperCase());
    setInput('');
    setShowAdd(false);
  };

  return (
    <main>
      <PageHeader title="Watchlist"/>
      <div className="min-h-screen bg-gray-50 p-5">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">Personalized market watchlist — live prices </p>
            </div>
            <div className="flex items-center gap-3">
              {/* <button
            onClick={() => setIsEditing(prev => !prev)}
            className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isEditing ? <Check className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            <span className = "text-sm">{isEditing ? "Done" : "Edit Widgets"}</span>
          </button> */}
              <button
                onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900"
              >
              <Plus className="w-5 h-5"/>
              <span className = "text-sm">{" "} Add to Watchlist</span>              
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* Left summary card */}
            <aside className="bg-white rounded-2xl shadow p-6 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg text-black font-medium">Watchlist Snapshot</h2>
                <div className="text-sm text-slate-500">Updated · now</div>
              </div>
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  {/* Status dot */}
                  <span
                    className={`
                      h-3 w-3 rounded-full 
                      ${marketTime === "Market Open" ? "bg-green-500 animate-pulse" : ""}
                      ${marketTime === "Market Closed" ? "bg-gray-400" : ""}
                      ${marketTime === "Pre-Market" ? "bg-blue-500 animate-pulse" : ""}
                      ${marketTime === "Post-Market" ? "bg-red-500 animate-pulse" : ""}
                    `}
                  />

                  {/* Status text */}
                  <span
                    className={`
                      text-sm font-medium 
                      ${marketTime === "Market Open" ? "text-green-600" : ""}
                      ${marketTime === "Market Closed" ? "text-gray-500" : ""}
                      ${marketTime === "Pre-Market" ? "text-blue-600" : ""}
                      ${marketTime === "Post-Market" ? "text-red-600" : ""}
                    `}
                  >
                    {marketTime}
                  </span>
                </div>
              </div>

              <div className={`text-xl font-semibold ${cumPercent < 0 ? "text-red-600" : "text-green-600"}`}>
                {cumPercent.toFixed(2)}% (today)
              </div>
              {overallSparkline.length > 1 && (
                <div className="flex justify-center my-4">
                  <Sparkline data={overallSparkline} color={cumPercent >= 0 ? "#16a34a" : "#ef4444"} width={200} height={50}/>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>Watchlist Size</div>
                  <div className="font-medium">{watchlist.length}</div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>Top Gainer</div>
                  <div className="font-medium">{topGainer ?? "_"}</div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>Top Loser</div>
                  <div className="font-medium">{topLoser ?? "_"}</div>
                </div>
              </div>
            </aside>

            {/* Right table */}
            <section className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SortButton label="Symbol" onClick={() => toggleSort('ticker')} active={sortKey==='ticker'} dir={sortDir}/>
                  <SortButton label="Price" onClick={() => toggleSort('price')} active={sortKey==='price'} dir={sortDir}/>
                  <SortButton label="% Chg" onClick={() => toggleSort('changePct')} active={sortKey==='changePct'} dir={sortDir}/>
                </div>
                <div className="text-sm text-slate-500">{sorted.length} items</div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex justify-center mb-2">
                  <Pagination totalPages={Math.ceil(sorted.length/itemsPerPage)} page={currentPage} setPage={setCurrentPage} maxButtons={5} appPage="Watchlist"/>
                </div>

                <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-30">Ticker</th>
                      <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">Price</th>
                      <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">% Chg</th>
                      <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">Spark</th>
                      <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {paginated.map(row => (
                      <tr key={row.ticker} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 max-w-[140px]">
                          <div className="font-medium truncate">{row.ticker}</div>
                          <div className="text-xs text-slate-500 break-words">{row.name}</div>
                        </td>
                        <td className="px-2 py-2 text-left text-sm text-black">${row.price.toFixed(2)}</td>
                        <td className={`px-2 py-2 text-left text-sm ${row.changePct>=0?'text-green-600':'text-red-600'}`}>
                          {row.changePct >= 0 ? '▲' : '▼'} {Math.abs(row.changePct).toFixed(2)}%
                        </td>
                        <td className="px-1 py-2">
                          <Sparkline data={row.sparkline} color={row.changePct >=0 ? '#16a34a':'#ef4444'} width={50} height={30}/>
                        </td>
                        <td className="px-2 py-1 pl-7">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition">
                                <MoreHorizontal className="h-4 w-4"/>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 shadow-lg rounded-md">
                              <DropdownMenuItem onClick={()=>router.push(`/charts?ticker=${row.ticker}`)}><BarChart3 className="w-4 h-4 mr-2 text-slate-600"/> Chart</DropdownMenuItem>
                              <DropdownMenuItem onClick={()=>router.push(`/news?search=${row.ticker}`)}><Newspaper className="w-4 h-4 mr-2 text-slate-600"/> Headlines</DropdownMenuItem>
                              <DropdownMenuItem onClick={()=>router.push(`/diary?add=true&ticker=${row.ticker}`)}><NotebookPen className="w-4 h-4 mr-2 text-slate-600"/> Add Trade</DropdownMenuItem>
                              <DropdownMenuSeparator/>
                              <DropdownMenuItem
                                onClick={() => removeTicker(row.ticker)}
                                className="text-red-600 hover:!bg-red-100 hover:!text-red-700 focus:!bg-red-100 focus:!text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </div>

        {/* Add ticker modal */}
        {showAdd && (
          <form onSubmit={handleAdd} className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setShowAdd(false)}/>
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h3 className="text-lg text-black font-semibold mb-2">Add Ticker</h3>
              <p className="text-sm text-slate-500 mb-4">Add a ticker symbol to your watchlist.</p>
              <div className="flex gap-2">
                <input type="text" autoFocus value={input} onChange={e=>setInput(e.target.value.toUpperCase())} className="flex-1 px-3 text-black py-2 border rounded" placeholder="e.g. AMZN"/>
                <button type="submit" className="px-4 py-2 bg-indigo-600 shadow-md text-white rounded-lg hover:bg-indigo-700">+</button>
              </div>
            </div>
          </form>
        )}

        {/* Detail drawer */}
        {selected && (
          <div className="fixed right-6 top-16 w-[420px] bg-white rounded-2xl shadow-lg p-6 z-40">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selected}</h3>
                <div className="text-sm text-slate-500">Detailed view — price, news and alerts</div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-slate-400">✕</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------- small subcomponents ----------
const Sparkline = React.memo(function Sparkline({data,color='#16a34a',width=60,height=30}:{data:number[],color?:string,width?:number,height?:number}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/(max-min||1))*height}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><polyline points={points} fill="none" stroke={color} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
});

function SortButton({label,onClick,active,dir}:{label:string,onClick:()=>void,active:boolean,dir:'asc'|'desc'}) {
  return <button onClick={onClick} className={`px-3 py-1 rounded-md text-sm ${active?'bg-slate-100':'bg-transparent'}`}>
    <div className="flex items-center gap-2">
      <span className="text-black font-medium">{label}</span>
      {active && <span className="text-xs text-black">{dir==='asc'?'↑':'↓'}</span>}
    </div>
  </button>
}

// 'use client';

// import React, { useEffect, useState, useRef, useMemo} from 'react';
// import { useRouter } from 'next/navigation';
// import Holidays from 'date-holidays';
// import { getTicker } from "@/components/ChartClient/Chart";
// import PageHeader from '@/components/PageHeader';
// import { toast } from 'sonner';
// import Pagination from "@/components/Pagination"
// import { supabase } from '@/lib/supabaseFrontendClient';
// import { MoreHorizontal, BarChart3, Newspaper, NotebookPen, Trash2 } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";

// type Ticker = {
//   ticker: string;
//   name: string;
//   price: number;
//   oldPrice: number; // previous close
//   changePct: number;
//   sparkline: number[];
// };

// export default function WatchlistPage() {
//   const router = useRouter();

//   const [watchlist, setWatchlist] = useState<Ticker[]>([]);
//   const socketRef = useRef<WebSocket | null>(null);
//   const [showAdd, setShowAdd] = useState(false);
//   const [selected, setSelected] = useState<string | null>(null);
//   const [input, setInput] = useState(""); 
//   const [sortKey, setSortKey] = useState<'ticker' | 'price' | 'changePct'>('ticker');
//   const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

//   const [userId, setUserId] = useState<string | null>(null);

//   const symbolMap: Record<string, string> = {
//     "^GSPC": "OANDA:SPX500_USD",   // S&P 500
//     "^DJI": "OANDA:US30_USD",      // Dow Jones
//     "^IXIC": "OANDA:NAS100_USD",   // Nasdaq 100
//     "^RUT": "OANDA:US2000_USD",    // Russell 2000
//   };

//   type WSUpdate = {
//     c: string[];
//     p: number;
//     s: string;
//     t: number;
//     v: number;
//   };

//   // 1. Get authenticated user once
//   useEffect(() => {
//     async function getUser() {
//       const { data, error } = await supabase.auth.getUser();
//       if (error || !data.user) return;
//       setUserId(data.user.id);
//     }
//     getUser();
//   }, []);


//    useEffect(() => {
//     if (!userId) return;

//     async function loadWatchlist() {
//       const { data: rows } = await supabase
//         .from("watchlist")
//         .select("ticker, name")   // <-- select both symbol and name
//         .eq("user_id", userId);

//       if (rows) {
//         for (const row of rows) {
//            // 2. Fetch prices
//           const newTicker = getTicker(row.ticker);
//           const oldPrice = await fetchPreviousClose(newTicker);
//           if (oldPrice == -1) {
//               toast.error('Oops! That ticker does not appear to be listed');
//               return;
//           }
//           const newPrice = await fetchNewPrice(newTicker);
//           const changePct = oldPrice && newPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
          
//           // 3. Update watchlist
//           setWatchlist(prev => [
//             ...prev,
//             {
//               ticker: newTicker,     // keep symbol separate
//               name: row.name,                  // fetched company name
//               price: newPrice,
//               oldPrice,
//               changePct,
//               sparkline: oldPrice && newPrice ? [oldPrice, newPrice] : oldPrice ? [oldPrice] : []
//             }
//           ]);
//           const finnhubSymbol = symbolMap[newTicker] || newTicker;

//           if (socketRef.current?.readyState === WebSocket.OPEN) {
//             socketRef.current.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSymbol}));
//           }
//         }
//       }
//     }

//     loadWatchlist();
//   }, [userId]);

//   // ----- Trading calendar -----
//   const hd = new Holidays("US");
//   const holidayCache: Record<number, Set<string>> = {};

//   function formatDateLocal(date: Date): string {
//     return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
//   }

//   function getHolidaySet(year: number) {
//     const holidays = hd.getHolidays(year);
//     return new Set(holidays.map(h => formatDateLocal(new Date(h.date))));
//   }
  
//   function isTradingDay(date: Date): boolean {
//     const day = date.getDay();
//     if (day === 0 || day === 6) return false;

//     const year = date.getFullYear();
//     if (!holidayCache[year]) holidayCache[year] = getHolidaySet(year);

//     const key = formatDateLocal(date);
//     return !holidayCache[year].has(key);
//   }
  
//   function getPreviousTradingDay(date: Date = new Date()): string {
//     const d = new Date(date);
//     d.setDate(d.getDate() - 1);
//     while (!isTradingDay(d)) d.setDate(d.getDate() - 1);
//     return formatDateLocal(d); // use local YYYY-MM-DD
//   }
  
//   // ----- Fetch previous close -----
//   async function fetchPreviousClose(ticker: string) {
//     try {
//       const prevDay = getPreviousTradingDay();
//       const prevDayDate = new Date(prevDay);
//       prevDayDate.setDate(prevDayDate.getDate() + 1); // period2 for yfinance
//       const nextDay = prevDayDate.toISOString().split("T")[0];

//       const url = new URL('/api/yfinance', window.location.origin);
//       url.searchParams.append('ticker', ticker);
//       url.searchParams.append('interval', "1d");
//       url.searchParams.append('start', prevDay);
//       url.searchParams.append('end', nextDay);

//       const res = await fetch(url.toString());
//       if (!res.ok) throw new Error('Failed to fetch previous close');
//       const data = await res.json();

//       return Array.isArray(data) && data.length ? data[0].close : 0;
//     } catch (err) {
//       console.warn(`Error fetching previous close for ${ticker}:`, err);
//       return -1;
//     }
//   }
//   // ----- Fetch previous close -----
//   async function fetchNewPrice(ticker: string) {
//     try {
//       const now = new Date();

//       // Convert to Eastern Time (because markets use ET)
//       const estNow = new Date(
//         now.toLocaleString("en-US", { timeZone: "America/New_York" })
//       );

//       // Define market open/close times
//       const marketOpen = new Date(estNow);
//       marketOpen.setHours(9, 30, 0, 0); // 9:30 AM ET
//       const marketClose = new Date(estNow);
//       marketClose.setHours(16, 0, 0, 0); // 4:00 PM ET

//       let interval = "1d";
//       let start: string;
//       let end: string;

//       if (estNow >= marketOpen && estNow < marketClose) {
//         // Market open → fetch 1m and take last close
//         interval = "1m";
//         start = estNow.toISOString().split("T")[0];
//         const tomorrow = new Date(estNow);
//         tomorrow.setDate(tomorrow.getDate() + 1);
//         end = tomorrow.toISOString().split("T")[0];
//       } else if (estNow >= marketClose) {
//         // Market closed today → use today as prevDay, tomorrow as end
//         start = estNow.toISOString().split("T")[0];
//         const tomorrow = new Date(estNow);
//         tomorrow.setDate(tomorrow.getDate() + 1);
//         end = tomorrow.toISOString().split("T")[0];
//       } else {
//         // Before open → use previous trading day
//         start = getPreviousTradingDay();
//         const nextDay = new Date(start);
//         nextDay.setDate(nextDay.getDate() + 1);
//         end = nextDay.toISOString().split("T")[0];
//       }

//       const url = new URL("/api/yfinance", window.location.origin);
//       url.searchParams.append("ticker", ticker);
//       url.searchParams.append("interval", interval);
//       url.searchParams.append("start", start);
//       url.searchParams.append("end", end);

//       const res = await fetch(url.toString());
//       if (!res.ok) throw new Error("Failed to fetch price data");

//       const data = await res.json();

//       if (!Array.isArray(data) || data.length === 0) return 0;

//       if (interval === "1d") {
//         // Daily → just take first item
//         return data[0].close;
//       } else {
//         // Intraday (1m) → take last available close
//         return data[data.length - 1].close;
//       }
//     } catch (err) {
//       console.warn(`Error fetching price for ${ticker}:`, err);
//       return -1;
//     }
//   }

//   const addTickerMock = async (ticker: string) => {
//     if (!ticker) return;
//     const newTicker = getTicker(ticker);
//     // 1. Fetch company name from your API
//     let name = newTicker;
//     try {
//       const res = await fetch(`/api/ticker-name?ticker=${newTicker}`);
//       if (res.ok) {
//         const data = await res.json();
//         if (data.name) name = data.name;
//       }
//     } catch (err) {
//       console.warn(`Failed to fetch name for ${newTicker}`, err);
//     }

//     // 2. Fetch prices
//     const oldPrice = await fetchPreviousClose(newTicker);
//     if (oldPrice == -1) {
//         toast.error('Oops! That ticker does not appear to be listed');
//         return;
//     }
//     const newPrice = await fetchNewPrice(newTicker);
//     const changePct = oldPrice && newPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

//     const alreadyAdded = watchlist.some(t => t.ticker === newTicker);

//     if (alreadyAdded) {
//       // show a toast
//       toast.error(`${newTicker} is already in your watchlist`);
//       return;
//     }
    
//     // 5. Add to Supabase watchlist table
//     const { error: insertError } = await supabase
//       .from("watchlist")
//       .insert([
//         {
//           user_id: userId,
//           ticker: newTicker,
//           name,
//         }
//       ]);

//     if (insertError) {
//       console.error("Failed to insert into watchlist:", insertError);
//       toast.error("Failed to add ticker to watchlist");
//       return;
//     }

//     // 3. Update watchlist
//     setWatchlist(prev => [
//       ...prev,
//       {
//         ticker: newTicker,     // keep symbol separate
//         name,                  // fetched company name
//         price: newPrice,
//         oldPrice,
//         changePct,
//         sparkline: oldPrice && newPrice ? [oldPrice, newPrice] : oldPrice ? [oldPrice] : []
//       }
//     ]);

//     // 4. Subscribe to websocket
//     const finnhubSymbol = symbolMap[newTicker] || newTicker;

//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSymbol }));
//     }
//     toast.success(`${newTicker} has been added to your watchlist!`);

//     setShowAdd(false);
//   };

//   // ----- Sorting -----
//   const sorted = useMemo(() => {
//     return [...watchlist].sort((a, b) => {
//       let comp = 0;
//       if (sortKey === 'ticker') comp = a.ticker.localeCompare(b.ticker);
//       else if (sortKey === 'price') comp = a.price - b.price;
//       else if (sortKey === 'changePct') comp = a.changePct - b.changePct;
//       return sortDir === 'asc' ? comp : -comp;
//     });
//   }, [watchlist, sortKey, sortDir]);

//   const toggleSort = (key: typeof sortKey) => {
//     if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
//     else { setSortKey(key); setSortDir('asc'); }
//   };

//   // Inside WatchlistPage, just before the closing </section> of your table
//  const [currentPage, setCurrentPage] = useState(0); // zero-based
//   const itemsPerPage = 4;

//   const totalPages = Math.ceil(sorted.length / itemsPerPage);

//   const paginated = useMemo(() => {
//     const start = currentPage * itemsPerPage;
//     return sorted.slice(start, start + itemsPerPage);
//   }, [sorted, currentPage, itemsPerPage]);

//   const removeTicker = async (ticker: string) => {
//     if (!userId) return; // guard

//     // 1. Update local state
//     setWatchlist(prev => prev.filter(t => t.ticker !== ticker));

//     // 2. Remove from Supabase
//     const { error } = await supabase
//       .from("watchlist")
//       .delete()
//       .eq("user_id", userId)
//       .eq("ticker", ticker);

//     if (error) {
//       console.error("Failed to remove ticker from Supabase:", error);
//       toast.error(`Failed to remove ${ticker} from your watchlist.`);
//       return;
//     }

//     // 3. Unsubscribe from WebSocket
//     const finnhubSymbol = symbolMap[ticker] || ticker;

//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({ type: "unsubscribe", symbol: finnhubSymbol }));
//     }

//     toast.success(`${ticker} removed from your watchlist.`);
//   };

//   // ---------- WebSocket + init ----------
//   useEffect(() => {
//     const initWebSocket = async () => {
//       const res = await fetch('/api/wsfinnhub');
//       if (!res.ok) return console.error('Failed to fetch WS URL');
//       const { wsUrl } = await res.json();

//       const ws = new WebSocket(wsUrl);
//       socketRef.current = ws;

//       ws.onmessage = (msg) => {
//         const data = JSON.parse(msg.data);
//         console.log(data);
//         if (!data.data) return;

//         setWatchlist(prev =>
//           prev.map(t => {
//           const finnhubSymbol = symbolMap[t.ticker] || t.ticker;
//           const update = data.data.find((u: WSUpdate) => u.s === finnhubSymbol);            
//           if (update) {
//               const newPrice = update.p;
//               const changePct = t.oldPrice > 0 ? ((newPrice - t.oldPrice) / t.oldPrice) * 100 : 0;
//               return {
//                 ...t,
//                 price: newPrice,
//                 changePct,
//                 sparkline: [...t.sparkline.slice(-20), newPrice],
//               };
//             }
//             return t;
//           })
//         );
//       };
//     };

//     initWebSocket();

//     return () => {
//       socketRef.current?.close();
//     };
//   }, []); // no watchlist dependency needed


//   const overallSparkline = useMemo(() => {
//     if (!watchlist.length) return [];

//     const maxLength = Math.max(...watchlist.map(t => t.sparkline.length));
//     const sparkData: number[] = [];

//     for (let i = 0; i < maxLength; i++) {
//       let sumChange = 0;
//       for (const t of watchlist) {
//         if (t.sparkline[i] !== undefined && t.oldPrice > 0) {
//           const pct = ((t.sparkline[i] - t.oldPrice) / t.oldPrice) * 100;
//           sumChange += pct;
//         }
//       }
//       sparkData.push(sumChange);
//     }

//     return sparkData;
//   }, [watchlist]);

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     addTickerMock(input.trim().toUpperCase()); // use input, not newSymbol
//     setShowAdd(false);
//     setInput("");
//   };

//   const cumPercent = watchlist.reduce((a,b)=>a+b.changePct,0);

//   let topGainer: string | null = null;
//   let topLoser: string | null = null;
//   let maxChange = -Infinity;
//   let minChange = Infinity;

//   for (const t of watchlist) {
//     if (t.changePct > maxChange && t.changePct > 0) {
//       maxChange = t.changePct;
//       topGainer = t.ticker;
//     }
//     if (t.changePct < minChange && t.changePct < 0) {
//       minChange = t.changePct;
//       topLoser = t.ticker;
//     }
//   }

//   return (
//     <main>
//       <PageHeader title="Watchlist"/>
//       <div className="min-h-screen bg-gray-50 p-5">
//         <div className="max-w-7xl mx-auto">
//           <header className="flex items-center justify-between mb-6">
//             <div>
//               {/* <h1 className="text-2xl font-semibold text-slate-900">Watchlist</h1> */}
//               <p className="text-sm text-slate-500">Personalized market watchlist — live prices </p>
//             </div>
//             <div className="flex items-center gap-3">
//               {/* <div className="relative">
//                 <input
//                   value={query}
//                   onChange={e => setQuery(e.target.value)}
//                   className="pl-3 pr-10 py-2 rounded-lg text-black border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   placeholder="Search by ticker or name"
//                 />
//                 <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
//               </div> */}
//               <button
//                 onClick={() => setShowAdd(true)}
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
//               >
//                 + Add
//               </button>
//             </div>
//           </header>

//           <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
//             {/* Left column: summary card */}
//             <aside className="bg-white rounded-2xl shadow p-6 h-fit">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-lg text-black font-medium">Watchlist Snapshot</h2>
//                 <div className="text-sm text-slate-500">Updated · now</div>
//               </div>
//               <div className="flex items-center gap-4 mb-4">
//                 {/* <div className="text-2xl text-black font-semibold">${watchlist.reduce((a,b)=>a+b.price,0).toFixed(2)}</div> */}
//                 <div className={`text-xl font-semibold ${cumPercent < 0 ? "text-red-600" : "text-green-600"}`}>{cumPercent.toFixed(2)}% (today)</div>
//               </div>

//               {overallSparkline.length > 1 && (
//                 <div className="flex justify-center mt-8 mb-8">
//                   <Sparkline
//                     data={overallSparkline}
//                     color={cumPercent >= 0 ? "#16a34a" : "#ef4444"}
//                     width={200}
//                     height={50}
//                   />
//                 </div>
//               )}

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between text-sm text-slate-600">
//                   <div>Watchlist Size</div>
//                   <div className="font-medium">{watchlist.length}</div>
//                 </div>
//                 <div className="flex items-center justify-between text-sm text-slate-600">
//                   <div>Top Gainer</div>
//                   <div className="font-medium">{topGainer ? topGainer : "_"}</div>
//                 </div>
//                 <div className="flex items-center justify-between text-sm text-slate-600">
//                   <div>Top Loser</div>
//                   <div className="font-medium">{topLoser ? topLoser : "_"}</div>
//                 </div>
//                 {/* <div className="flex items-center justify-between text-sm text-slate-600">
//                   <div>Alerted</div>
//                   <div className="font-medium">2</div>
//                 </div> */}
//               </div>
//             </aside>

//             {/* Right column: table */}
//             <section className="bg-white rounded-2xl shadow p-4">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <SortButton label="Symbol" onClick={() => toggleSort('ticker')} active={sortKey==='ticker'} dir={sortDir}/>
//                   <SortButton label="Price" onClick={() => toggleSort('price')} active={sortKey==='price'} dir={sortDir}/>
//                   <SortButton label="% Chg" onClick={() => toggleSort('changePct')} active={sortKey==='changePct'} dir={sortDir}/>
//                 </div>
//                 <div className="text-sm text-slate-500">{sorted.length} items</div>
//               </div>

//               <div className="overflow-x-auto">
//                 <div className="flex justify-center">
//                   <Pagination
//                     totalPages={totalPages}
//                     page={currentPage}
//                     setPage={setCurrentPage}
//                     maxButtons={5}  // optional
//                     appPage = "Watchlist"
//                   />
//                 </div>
//                 <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
//                   <thead className="bg-slate-50">
//                     <tr>
//                       <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-30">
//                         Ticker
//                       </th>
//                       <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">
//                         Price
//                       </th>
//                       <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">
//                         % Chg
//                       </th>
//                       <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-25">
//                         Spark
//                       </th>
//                       <th className="px-2 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider w-20">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-slate-100">
//                     {paginated.map((row) => (
//                       <tr key={row.ticker} className="hover:bg-slate-50 transition-colors">
//                         <td className="px-2 py-2 max-w-[140px]">
//                           <div className="font-medium truncate">{row.ticker}</div>
//                           <div className="text-xs text-slate-500 break-words">{row.name}</div>
//                         </td>
//                         <td className="px-2 py-2 text-left text-sm text-black">
//                           ${row.price.toFixed(2)}
//                         </td>
//                         <td
//                           className={`px-2 py-2 text-left text-sm ${
//                             row.changePct >= 0 ? 'text-green-600' : 'text-red-600'
//                           }`}
//                         >
//                           {row.changePct >= 0 ? '▲' : '▼'} {Math.abs(row.changePct).toFixed(2)}%
//                         </td>
//                         <td className="px-1 py-2 text-left">
//                           <Sparkline
//                             data={row.sparkline}
//                             color={row.changePct >= 0 ? '#16a34a' : '#ef4444'}
//                             width={50}
//                             height={30}
//                           />
//                         </td>
//                         <td className="px-2 py-1 pl-7">
//                           <div className="flex items-center gap-1">
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <button className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition">
//                                   <MoreHorizontal className="h-4 w-4" />
//                                 </button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-44 shadow-lg rounded-md">
//                                 <DropdownMenuItem onClick={() => router.push(`/charts?ticker=${row.ticker}`)}>
//                                   <BarChart3 className="w-4 h-4 mr-2 text-slate-600" /> Chart
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem onClick={() => router.push(`/news?search=${row.ticker}`)}>
//                                   <Newspaper className="w-4 h-4 mr-2 text-slate-600" /> Headlines
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem onClick={() => router.push(`/diary?add=true&ticker=${row.ticker}`)}>
//                                   <NotebookPen className="w-4 h-4 mr-2 text-slate-600" /> Add Trade
//                                 </DropdownMenuItem>
//                                 <DropdownMenuSeparator />
//                                 <DropdownMenuItem onClick={() => removeTicker(row.ticker)} className="text-red-600 focus:text-red-600">
//                                   <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Remove
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </section>
//           </section>
//         </div>

//         {/* Add ticker modal */}
//         {showAdd && (
//           <form onSubmit = {handleSearch} className="fixed inset-0 flex items-center justify-center z-50">
//             <div 
//               className="absolute inset-0 bg-black/40" 
//               onClick={() => setShowAdd(false)} 
//             />
//             <div className="relative bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
//               <h3 className="text-lg text-black font-semibold mb-2">Add Ticker</h3>
//               <p className="text-sm text-slate-500 mb-4">Add a ticker symbol to your watchlist.</p>
//               <div className="flex gap-2">
//                 <input 
//                   type = "text"
//                   autoFocus
//                   value={input.trim().toUpperCase()} 
//                   onChange={(e) => setInput(e.target.value.toUpperCase())}
//                   className="flex-1 px-3 text-black py-2 border rounded" placeholder="e.g. AMZN" />
//                 <button 
//                   type = "submit"
//                   className="px-4 py-2 bg-indigo-600 shadow-md text-white rounded-lg hover:bg-indigo-700">
//                     +
//                 </button>
//               </div>
//             </div>
//           </form>
//         )}

//         {/* Detail drawer */}
//         {selected && (
//           <div className="fixed right-6 top-16 w-[420px] bg-white rounded-2xl shadow-lg p-6 z-40">
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="text-lg font-semibold">{selected}</h3>
//                 <div className="text-sm text-slate-500">Detailed view — price, news and alerts</div>
//               </div>
//               <button onClick={()=>setSelected(null)} className="text-slate-400">✕</button>
//             </div>
//           </div>
//         )}
//       </div>
//     </main>
//   )
// }

// // ---------- small subcomponents ----------
// const Sparkline = React.memo(function Sparkline({
//   data,
//   color = '#16a34a',
//   width = 60,
//   height = 30,
// }: {
//   data: number[];
//   color?: string;
//   width?: number;
//   height?: number;
// }) {
//   if (!data.length) return null;

//   const min = Math.min(...data);
//   const max = Math.max(...data);

//   const points = data
//     .map((v, i) => {
//       const x = (i / (data.length - 1)) * width;
//       const y = height - ((v - min) / (max - min || 1)) * height;
//       return `${x},${y}`;
//     })
//     .join(' ');

//   return (
//     <svg
//       width={width}
//       height={height}
//       viewBox={`0 0 ${width} ${height}`}
//       className="inline-block"
//     >
//       <polyline
//         points={points}
//         fill="none"
//         stroke={color}
//         strokeWidth={0.5}
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// });


// function SentimentBadge({ sentiment }: { sentiment?: 'positive' | 'neutral' | 'negative' }) {
//   if (!sentiment) return <span className="text-sm text-slate-400">—</span>
//   const map: Record<string, string> = {
//     positive: 'bg-green-50 text-green-700',
//     neutral: 'bg-yellow-50 text-yellow-700',
//     negative: 'bg-red-50 text-red-700',
//   }
//   return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[sentiment]}`}>{sentiment}</span>
// }

// function SortButton({ label, onClick, active, dir }: { label: string; onClick: () => void; active: boolean; dir: 'asc'|'desc' }) {
//   return (
//     <button onClick={onClick} className={`px-3 py-1 rounded-md text-sm ${active ? 'bg-slate-100' : 'bg-transparent'}`}>
//       <div className="flex items-center gap-2">
//         <span className="text-black font-medium">{label}</span>
//         {active && <span className="text-xs text-black">{dir === 'asc' ? '↑' : '↓'}</span>}
//       </div>
//     </button>
//   )
// }
