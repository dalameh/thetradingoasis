'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton"; // shadcn/ui skeleton
import { Search, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react"

// Types
import type { Data, Layout, Config } from 'plotly.js';

// Dynamically import Plotly for client only
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ScansPage() {
  const [symbol, setSymbol] = useState('SPY');
  const [figure, setFigure] = useState<{ data: Data[]; layout: Partial<Layout>; config: Partial<Config> } | null>(null);
  const [regimeStats, setRegimeStats] = useState<Record<string, [number, number]> | null>(null);
  const [currRegime, setCurrRegime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState(symbol);

 useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;

  async function fetchPlot() {
    setLoading(true);
    setError(null);
    setFigure(null);

    try {
      const query = new URLSearchParams({ symbol }).toString();
      const res = await fetch(`/api/hmmplot?${query}`, { signal });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error fetching ${symbol} plot: ${res.status} ${res.statusText} - ${text}`);
      }

      const data = await res.json();

      if (!data?.figure) throw new Error("Invalid response from backend");

      setFigure(data.figure);
      setRegimeStats(data.regime_stats ?? null);
      setCurrRegime(data.curr_regime ?? "");
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") return; // fetch was aborted
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  fetchPlot();

  // Cleanup: abort previous fetch if symbol changes
  return () => controller.abort();
}, [symbol]);


  return (
    <main>
      <PageHeader title="Scans" />
      <div className="max-w-5xl min-h-screen mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Main Content  */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
           {/* Plot  */}
          <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-lg border flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 text-center">
              📊 3-State Gaussian HMM (KMeans Initialization)
            </h2>
           {/* Control Bar  */}
            <div className="bg-white flex flex-row items-center justify-center w-full max-w-xs mx-auto p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim()) setSymbol(input.trim().toUpperCase());
                }}
                className="flex flex-row w-full space-x-2"
              >
                <input
                  type="text"
                  aria-label="Ticker symbol"
                  placeholder="Enter ticker or company (e.g. NVDA)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="
                    bg-white text-black
                    text-sm sm:text-md
                    placeholder:text-sm sm:placeholder:text-md
                    shadow-md flex-grow min-w-0 px-4 py-2
                    border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>


            {error && <div className="text-red-600 text-center">{error}</div>}

            <div className="flex-1 flex items-center justify-center">
              {loading && (
                <Skeleton className="w-full h-[350px] rounded-lg" />
              )}

              {!loading && figure && (
                <Plot
                  data={figure.data}
                  layout={{
                    ...figure.layout,
                    autosize: true,
                    margin: { l: 40, r: 20, t: 30, b: 30 },
                    height: 351,
                  }}
                  config={{
                    ...figure.config,
                    responsive: true,
                    displayModeBar: true,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '351px' }}
                />
              )}
            </div>
          </div>

           {/* Stats — will stretch to match Plot height */}
          <div className="flex flex-col gap-4 h-full">
            {loading && (
              <>
                <Skeleton className="flex-1 rounded-xl" />
                <Skeleton className="flex-1 rounded-xl" />
                <Skeleton className="flex-1 rounded-xl" />
                <Skeleton className="flex-1 rounded-xl" />
              </>
            )}

            {!loading && regimeStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                name: "Current", 
                icon: Activity, 
                gradient: "from-orange-400 to-orange-600" 
              },
              { 
                name: "Bullish", 
                icon: TrendingUp, 
                gradient: "from-green-400 to-green-600" 
              },
              { 
                name: "Neutral", 
                icon: BarChart3, 
                gradient: "from-blue-400 to-blue-600" 
              },
              { 
                name: "Bearish", 
                icon: TrendingDown, 
                gradient: "from-red-400 to-red-600" 
              },
            ].map(({ name, icon: Icon, gradient }) => (
              <div
                key={name}
                className={`flex-1 flex flex-col items-center justify-center rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient} transition-transform hover:scale-105`}
              >
               
                <div className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="text-lg font-semibold">{name} Regime</div>

                <div className="text-sm opacity-80 mb-1">{name === "Current" ? "" : "Avg Span"}</div>

                <div className="text-md text-center font-bold tracking-wide">
                  {regimeStats[name]
                    ? `${regimeStats[name][0].toFixed(2)} days`
                    : currRegime}
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </main>
  );
}