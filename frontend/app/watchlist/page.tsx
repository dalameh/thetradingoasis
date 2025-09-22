'use client';

import React, { useState, useMemo, useEffect, Suspense} from 'react';
import { useWatchlistStore } from '@/store/WatchlistStore';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import {isTradingDay, getESTDate } from '@/store/WatchlistStore'
import { useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, BarChart3, Newspaper, NotebookPen, Trash2 , Plus} from 'lucide-react';
import { useRouter } from 'next/navigation';

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addParam = searchParams.get("add");
  const { watchlist, addTicker, removeTicker } = useWatchlistStore();

  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // React to URL changes
  useEffect(() => {
    if (addParam) {
      setShowAdd(true);
    }
  }, [addParam]);

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
            <div className = "sm:max-w-3x1">
              <p className="text-sm text-slate-500">Personalized live market watchlist </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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

              <div className={`text-xl flex justify-center mb-4 font-semibold ${cumPercent < 0 ? "text-red-600" : "text-green-600"}`}>
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
              <div className="overflow-y-hidden overflow-x-auto flex-1 rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full table-fixed divide-y divide-gray-200 h-full">
                  <thead className="bg-gray-300/40 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-30">Ticker</th>
                      <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">Price</th>
                      <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">% Chg</th>
                      <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">Spark</th>
                      <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {paginated.map(row => (
                      <tr key={row.ticker} className="hover:bg-blue-50 transition-colors">
                        <td className="px-2 py-2 max-w-[140px]">
                          <div className="font-medium text-sm truncate">{row.ticker}</div>
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
              </div>
              {paginated.length == 0 && 
                <div className = "pt-10 flex justify-center items-center">Watchlist is Empty</div>
              }
            </section>
          </section>
        </div>

        {/* Add ticker modal */}
        {showAdd && (
          <form onSubmit={handleAdd} className="fixed inset-0 flex items-center justify-center z-50 p-8">
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

export default function WatchlistPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading watchlist...</div>}>
      <WatchlistContent />
    </Suspense>
  );
}