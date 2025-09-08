'use client';

import React, { memo } from "react";
import SetupMenu from "./SetupMenu";
import { Setup } from "@/types";

type SetupItemProps = {
  setup: Setup;
  onEdit: (setup: Setup) => void;
  onDelete: (id: string) => void;
};

function SetupItemComponent({ setup, onEdit, onDelete }: SetupItemProps) {
  const formatPct = (v?: number | string) => {
    if (v == null) return '—';
    if (typeof v === 'number') return `${Number(v).toFixed(1)}%`;
    return v;
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-xl transform scale-95 hover:scale-100 shadow-lg border border-gray-800 hover:shadow-2xl transition relative">
      <div className="absolute top-3 right-3">
        <SetupMenu onEdit={() => onEdit(setup)} onDelete={() => onDelete(setup.id)} />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{setup.name}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            {setup.type && (
              <span className="px-2 py-0.5 rounded-full bg-blue-800 text-white text-xs font-semibold">
                {setup.type}
              </span>
            )}
            {setup.market && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg ${
                setup.market === 'bullish'
                  ? 'bg-green-800 text-green-300'
                  : setup.market === 'neutral'
                  ? 'bg-amber-400 text-black'
                  : 'bg-red-500 text-white'
              }`}>
                {setup.market.charAt(0).toUpperCase() + setup.market.slice(1)}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-right text-xs space-y-1 px-4">
            <div>
              <span className="text-gray-400">Win Rate</span>
              <div className="text-green-400 font-bold text-lg">{formatPct(setup.win_rate)}</div>
            </div>
            <div>
              <span className="text-gray-400">Avg Return</span>
              <div className="text-green-400 font-bold text-lg">{formatPct(setup.avg_return)}</div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-300 pb-3 text-sm text-center">{setup.description}</p>

      <div className="mb-5">
        <strong className="text-gray-100">Trading Rules:</strong>
        <ul className="list-disc list-outside pl-4 mt-4 space-y-1">
          {setup.rules.map((rule, i) => (
            <li key={i} className="marker:text-green-400 text-xs mb-3 font-mono">{rule}</li>
          ))}
        </ul>
      </div>

      {setup.conditions && (
        <div className="bg-gray-800 text-gray-200 px-4 py-3 rounded-md mt-2 mb-2">
          <strong className="text-gray-100">Market Conditions:</strong>
          <p className="mt-1 text-sm">{setup.conditions}</p>
        </div>
      )}

      {setup.created_at && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 pr-2">
          {`Created On: ${new Date(setup.created_at).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SetupItemComponent);