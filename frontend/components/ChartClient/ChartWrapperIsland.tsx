'use client';

import dynamic from "next/dynamic";

const ChartWrapper = dynamic(() => import("@/components/ChartClient/ChartWrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 text-gray-400">
      Building chart...
    </div>
  ),
});

export default function ChartWrapperIsland() {
  return <ChartWrapper />;
}