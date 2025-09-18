'use client';

import React, { useState, useMemo } from 'react';
import { useWatchlistStore } from '@/store/WatchlistStore';
import Pagination from '@/components/Pagination';

type WatchlistTableProps = {
  rpp: number;
};

export default function WatchlistTable({rpp} : WatchlistTableProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const { watchlist} = useWatchlistStore();
    
    const sorted = useMemo(() => {
        return [...watchlist].sort((a, b) => {
        let comp = 0;
        comp = a.ticker.localeCompare(b.ticker);
        return comp
        });
    }, [watchlist]);

     const paginated = useMemo(() => {
        const start = currentPage * rpp;
        return sorted.slice(start, start + rpp);
      }, [sorted, currentPage]);

    return (
        <div className="overflow-x-auto">
            <div className="flex justify-center transform scale-85">
                <Pagination totalPages={Math.ceil(sorted.length/rpp)} page={currentPage} setPage={setCurrentPage} maxButtons={5} appPage="Watchlist"/>
            </div>
            
            <div className="overflow-y-hidden overflow-x-auto flex-1 rounded-xl">
                <table className="min-w-full table-fixed divide-y divide-gray-200 h-full">
                    <thead className="bg-gray-300/40 sticky top-0 z-10">
                        <tr>
                        <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-30">Ticker</th>
                        <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">Price</th>
                        <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">% Chg</th>
                        <th className="px-2 py-4 text-left font-semibold text-xs text-gray-700 uppercase tracking-wider w-25">Spark</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                    {paginated.map(row => (
                            <tr key={row.ticker} className="hover:bg-blue-50 transition-colors">
                            <td className="px-2 py-2 max-w-[140px]">
                                <div className="text-sm font-medium truncate">{row.ticker}</div>
                                <div className="text-[10px] text-slate-500 break-words">{row.name}</div>
                            </td>
                            <td className="px-2 py-2 text-left text-sm text-black">${row.price.toFixed(2)}</td>
                            <td className={`px-2 py-2 text-left text-sm ${row.changePct>=0?'text-green-600':'text-red-600'}`}>
                                {row.changePct >= 0 ? '▲' : '▼'} {Math.abs(row.changePct).toFixed(2)}%
                            </td>
                            <td className="px-2 py-2">
                                <Sparkline data={row.sparkline} color={row.changePct >=0 ? '#16a34a':'#ef4444'} width={50} height={30}/>
                            </td>
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
                {paginated.length == 0 &&
                <div className="flex flex-col justify-center items-center text-gray-500 h-[300]">
                    <span className="text-4xl mb-2">📋</span>
                    <p className="text-sm">Your watchlist is empty.</p>
                    <p className="text-xs text-center">
                        Add stocks or options to track them here. Once added, they’ll appear in your watchlist.
                    </p>
                </div>
                }
            </div>
        </div>
    )
}

// ---------- small subcomponents ----------
const Sparkline = React.memo(function Sparkline({data,color='#16a34a',width=60,height=30}:{data:number[],color?:string,width?:number,height?:number}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/(max-min||1))*height}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><polyline points={points} fill="none" stroke={color} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
});