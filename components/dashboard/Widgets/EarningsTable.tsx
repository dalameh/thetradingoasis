'use client';

import React, { useEffect, useState } from 'react';
// server side client
import { supabase } from '@/lib/supabaseFrontendClient';

type Ticker = {
  ticker: string;
  company_name: string;
};

type Earning = {
  symbol: string;
  company_name: string;
  date: string;
  time: string;
  epsEstimate?: number;
  epsActual?: number;
};

type EarningsTableProps = {
  rpp: number;
};

export default function EarningsTable({ rpp }: EarningsTableProps) {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = rpp;
  const [page, setPage] = useState(0);

  // row measurement
  const sortedEarnings = earnings.slice().sort((a, b) => a.date.localeCompare(b.date));
  const totalPages = Math.max(1, Math.ceil(sortedEarnings.length / Math.max(1, rowsPerPage)));
  // clamp page
  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageData = sortedEarnings.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  useEffect(() => {
    async function fetchTickers() {
      const sp500 = await supabase.from('sp500_tickers').select('ticker, company_name');
      const nd100 = await supabase.from('nd100_tickers').select('ticker, company_name');
      const djia = await supabase.from('djia_tickers').select('ticker, company_name');

      if (sp500.error || nd100.error || djia.error) {
        console.error('Failed to load tickers');
        return;
      }

      const allTickers = [
        ...(sp500.data || []),
        ...(nd100.data || []),
        ...(djia.data || []),
      ];

      setTickers(allTickers);
    }

    fetchTickers();
  }, []);

  useEffect(() => {
    async function fetchEarnings() {
      if (tickers.length === 0) return;

      setLoading(true);

      const today = new Date().toLocaleDateString("en-CA"); 
      const twoWeeksLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      console.log(today);

      try {
        const res = await fetch(`/api/eefinnhub?from=${today}&to=${twoWeeksLater}`);

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();

        if (!data.earningsCalendar) {
          console.error('No earnings data found');
          setLoading(false);
          return;
        }

        const tickerSet = new Set(tickers.map((t) => t.ticker));

        const filtered = data.earningsCalendar
          .filter((e: Earning) => tickerSet.has(e.symbol))
          .map((e: Earning) => {
            const match = tickers.find(t => t.ticker === e.symbol);
            return {
              ...e,
              company_name: match ? match.company_name : 'Unknown',
            };
          });

        setEarnings(filtered);
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
      }
      setLoading(false);
    }

    fetchEarnings();
  }, [tickers]);

  return (
    <div className="flex flex-col h-full max-h-[435px] ">
      {/* Table container */}
      <div className="overflow-y-hidden overflow-x-auto flex-1 rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <table className="min-w-full table-fixed divide-y divide-gray-200 h-full">
            <colgroup>
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} />
            </colgroup>
            <thead className="bg-gray-300/40 sticky top-0 z-10">
               <tr>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">EPS Estimate</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">EPS Realized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {[...Array(4)].map((_, i) => (
              <tr key={i} className="hover:bg-blue-50 transition-colors duration-200">
                <td className="px-2 py-3 text-gray-700 text-center text-xs"><div className="h-4 bg-gray-300 rounded animate-pulse" /></td>
                <td className="px-2 py-3 text-gray-700 text-center text-xs"><div className="h-4 bg-gray-300 rounded animate-pulse" /></td>
                <td className="px-2 py-3 text-gray-700 text-center text-xs"><div className="h-4 bg-gray-300 rounded animate-pulse" /></td>
                <td className="px-2 py-3 text-center text-xs font-semibold"><div className="h-4 bg-gray-300 rounded animate-pulse" /></td>
              </tr>
            ))}
            </tbody>
          </table>
        ) : earnings.length === 0 ? (
          <p className="text-black">No earnings in the next week.</p>
        ) : (
          <table className="min-w-full table-fixed divide-y divide-gray-200 h-full">
            <colgroup>
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} /> 
              <col style={{ width: '25%' }} />
            </colgroup>

            <thead className="bg-gray-300/40 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">EPS Estimate</th>
                <th className="px-2 py-7 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">EPS Realized</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {pageData.map((e) => (
                <tr key={`${e.symbol}-${e.date}`} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-2 py-3 text-gray-900 text-center text-xs font-medium">
                  {e.symbol} <span className="text-gray-500">({e.company_name})</span>
                </td>
                <td className="px-2 py-3 text-gray-700 text-center text-xs">
                  {e.date}
                </td>
                <td className="px-2 py-3 text-gray-700 text-center text-xs">
                  {e.epsEstimate ?? '-'}
                </td>
                <td
                  className={`px-2 py-3 text-center text-xs font-semibold ${
                    e.epsActual != null && e.epsEstimate
                      ? e.epsActual >= e.epsEstimate
                        ? 'text-green-600'
                        : 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {e.epsActual ?? '-'}
                </td>
                </tr>
              ))}

              {/* Filler rows to maintain height */}
              {Array.from({ length: rowsPerPage - pageData.length }).map((_, i) => (
                <tr key={`filler-${i}`} className="h-15">
                  <td colSpan={4}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}    
      </div>
      {/* Pagination outside table */}
      <div className="flex justify-center p-4 border-t border-gray-200 space-x-2">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              page === idx ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

