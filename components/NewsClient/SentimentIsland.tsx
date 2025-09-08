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

type SentimentItem = { name: string; value: number };

interface SentimentIslandProps {
  headlines: string[];
}

const COLORS = ["#22c55e", "#0088ff", "#ef4444"];

export default function SentimentIsland({ headlines }: SentimentIslandProps) {
  const [sentiment, setSentiment] = useState<SentimentItem[]>([]);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize payload so effect only runs when headlines truly change
  const payload = useMemo(() => ({ headlines }), [headlines]);

  useEffect(() => {
    if (!payload.headlines || payload.headlines.length === 0) {
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

        const res = await fetch("/api/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const percentages: SentimentItem[] = data.summary?.percentages
          ? Object.entries(data.summary.percentages).map(([name, value]) => ({
              name,
              value: Number(value),
            }))
          : [];

        if (!cancelled) {
          setSentiment(percentages);
          setLoadingSentiment(false);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Sentiment fetch error:", err);
        if (!cancelled) {
          setError(err?.message ?? "Sentiment request failed");
          setLoadingSentiment(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        controller.abort();
      } catch (e) {}
    };
  }, [payload]);

  // Shimmer placeholder (chart-like) — NO header here
  const ShimmerChart = (
    <div className="h-72 flex items-center justify-center" aria-hidden>
      <div className="relative w-40 h-40">
        {/* base pulsing circle */}
        <div className="absolute inset-0 rounded-full bg-gray-100 animate-pulse" />
        {/* decorative spinning "slices" border */}
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

  // Memoized chart subtree (recharts pieces)
  const chart = useMemo(() => {
    if (!sentiment.length) return null;

    return (
      <ResponsiveContainer width="100%" height="100%">
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
                fill={COLORS[idx % COLORS.length]}
                strokeWidth={activeIndex === idx ? 4 : 1}
                style={{
                  transform: activeIndex === idx ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 0.2s ease, stroke-width 0.2s ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `${val}%`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    );
  }, [sentiment, activeIndex]);

  if (loadingSentiment) {
    return ShimmerChart;
  }

  if (error) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

 // at this point, loadingSentiment is false
if (sentiment.length === 0) {
  // show "no high-confidence predictions"
  return (
    <p className="text-center text-gray-700">
      No high-confidence predictions
    </p>
  );
}

  return <div className="h-72 flex items-center justify-center overflow-visible">{chart}</div>;
}