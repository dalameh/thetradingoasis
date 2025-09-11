"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabaseFrontendClient";

type SentimentItem = { name: string; value: number };

interface SentimentIslandProps {
  ticker: string;
  headlines: string[];
}

// Map sentiment names to colors
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e", // green
  neutral: "#0088ff",  // blue
  negative: "#ef4444", // red
};

export default function SentimentIsland({ ticker, headlines }: SentimentIslandProps) {
  const [sentiment, setSentiment] = useState<SentimentItem[]>([]);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => ({ headlines, ticker, min_confidence: 0.7 }), [headlines, ticker]);

  useEffect(() => {
    if (!headlines || headlines.length === 0) {
      setSentiment([]);
      setLoadingSentiment(true);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingSentiment(true);
        setError(null);

        // 1️⃣ Fetch the last two rows for this ticker
        const { data: rows, error: supabaseError } = await supabase
          .from("sentiment_results")
          .select("*")
          .eq("ticker", ticker)
          .order("created_at", { ascending: false }) // newest first
          .limit(2); // <-- fetch last two rows

        console.log("Supabase", rows);
        if (supabaseError) throw supabaseError;

        let foundMatch = false;

        if (rows && rows.length > 0) {
          for (const row of rows) {
            const storedHeadlines: string[] = row.headlines ?? [];
            const sameHeadlines =
              storedHeadlines.length === headlines.length &&
              storedHeadlines.every((h, i) => h === headlines[i]);

            if (sameHeadlines) {
              const percentages: SentimentItem[] = Object.entries(
                row.summary.percentages
              ).map(([name, value]) => ({ name, value: Number(value) }));

              if (!cancelled) {
                setSentiment(percentages);
                setLoadingSentiment(false);
              }
              foundMatch = true;
              break; // stop checking after first match
            }
          }
        }

        console.log(foundMatch);
        // 2️⃣ If no match, call API as before
        if (!foundMatch) {
          const res = await fetch("/api/sentiment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ headlines, ticker, min_confidence: 0.7 }),
            signal: controller.signal,
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          console.log("API RETURN", data);

          const percentages: SentimentItem[] = Object.entries(
            data.summary?.percentages ?? {}
          ).map(([name, value]) => ({ name, value: Number(value) }));

          if (!cancelled) {
            setSentiment(percentages);
            setLoadingSentiment(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setLoadingSentiment(false);
        }
      }
    })();


    return () => {
      cancelled = true;
      try { controller.abort(); } catch {}
    };
  }, [payload, ticker, headlines]);

  // Shimmer placeholder
  const ShimmerChart = (
    <div className="h-72 flex items-center justify-center" aria-hidden>
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full bg-gray-100 animate-pulse" />
        <div
          className="absolute inset-0 rounded-full border-4 animate-spin-reverse"
          style={{
            borderTopColor: "#ef4444",
            borderRightColor: "#0ea5e9",
            borderBottomColor: "#16a34a",
            borderLeftColor: "#e5e7eb",
            transform: "rotate(20deg)",
          }}
        />
      </div>
    </div>
  );

  const chart = useMemo(() => {
    if (!sentiment.length) return null;

    return (
      <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
        <PieChart>
          <Pie
            data={sentiment}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            label={(entry) => `${entry.value}%`}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {sentiment.map((entry, idx) => (
              <Cell
                key={idx}
                fill={SENTIMENT_COLORS[entry.name] ?? "#888"} // fallback gray
                strokeWidth={activeIndex === idx ? 4 : 1}
                style={{
                  transform: activeIndex === idx ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 0.2s ease, stroke-width 0.2s ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip wrapperStyle={{ overflow: "visible", zIndex: 1000 }} formatter={(val) => `${val}%`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    );
  }, [sentiment, activeIndex]);

  if (loadingSentiment) return ShimmerChart;
  if (error)
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );

  if (sentiment.length === 0)
    return <p className="text-center text-gray-700">No high-confidence predictions</p>;

  return <div className="h-72 flex items-center justify-center overflow-visible">{chart}</div>;
}