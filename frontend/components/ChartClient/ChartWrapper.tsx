"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getTicker } from "@/components/ChartClient/Chart";

const Chart = dynamic(() => import("@/components/ChartClient/Chart"), { ssr: false });

function ChartContent() {
  const searchParams = useSearchParams();
  const tickerParam = searchParams.get("ticker");

  const [displayName, setDisplayName] = useState("S&P 500");
  const [ticker, setTicker] = useState(getTicker("S&P500"));

  // React to URL changes
  useEffect(() => {
    if (tickerParam) {
      const mappedTicker = getTicker(tickerParam); // always map via getTicker
      setTicker(mappedTicker);
      setDisplayName(tickerParam.toUpperCase()); // nice display
    } else {
      setTicker(getTicker("S&P500"));
      setDisplayName("S&P 500");
    }
  }, [tickerParam]);

  return (
    <>
      <header className="flex text-black font-bold justify-center mb-5 space-x-2">
        {displayName}
      </header>
      <Chart
        ticker={ticker}
        width={Math.min(1200, window.innerWidth - 300)} // responsive max width
        height={275}
        page="chart"
      />
    </>
  );
}

export default function ChartWrapper() {
  return (
    <Suspense fallback={<div className="text-center">Loading chart...</div>}>
      <ChartContent />
    </Suspense>
  );
}