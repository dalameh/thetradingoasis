import React from "react";

interface PaginationProps {
  totalPages: number;
  page: number;                // zero-based
  setPage: (page: number) => void;
  maxButtons?: number;         // max numbered buttons (center group)
  appPage?: string;
}

export default function Pagination({
  totalPages,
  page,
  setPage,
  maxButtons = 5,
  appPage
}: PaginationProps) {
 
  if (totalPages === 1) {
    return (
      <div className={`w-full ${appPage === "Watchlist" ? "bg-white" : "bg-gray-100"} pb-3`}>
          <div className="flex items-center justify-center gap-2 tabular-nums overflow-hidden p-1">
          <button
            type="button"
            aria-label="Page 1"
            aria-current="page"
             className={`w-10 h-10 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-600 border-blue-600 text-white text-md font-semibold shadow-sm"
                }`}
          >
            1
          </button>
        </div>
      </div>
    );
  }

if (totalPages <= 0) return null; // safeguard

  // Build the dynamic list of tokens to render (first/last, ellipses, numbers)
  const createPageButtons = () => {
    const buttons: (number | "left-ellipsis" | "right-ellipsis")[] = [];
    const half = Math.floor(maxButtons / 2);

    let start = Math.max(0, page - half);
    let end = Math.min(totalPages - 1, page + half);

    if (start === 0) end = Math.min(totalPages - 1, maxButtons - 1);
    if (end === totalPages - 1) start = Math.max(0, totalPages - maxButtons);

    if (start > 0) {
      buttons.push(0);
      if (start > 1) buttons.push("left-ellipsis");
    }
    for (let i = start; i <= end; i++) buttons.push(i);
    if (end < totalPages - 1) {
      if (end < totalPages - 2) buttons.push("right-ellipsis");
      buttons.push(totalPages - 1);
    }
    return buttons;
  };

  const tokens = createPageButtons();

  // ---- Keep arrows fixed: lock the center group's width ----
  // Each token is a fixed-size "slot". We reserve enough slots for worst-case:
  // numbers (maxButtons) + first + last + both ellipses = maxButtons + 4
  const GAP_PX = 8;   // matches gap-2
  const worstCaseTokens =
    totalPages <= maxButtons ? totalPages : maxButtons + 4;

  const goPrev = () => setPage(Math.max(0, page - 1));
  const goNext = () => setPage(Math.min(totalPages - 1, page + 1));

  return (
    <div className={`w-full ${appPage === "Watchlist" ? "bg-white" : "bg-gray-100"} pb-3`}>
      {/* Outer strip centered; arrows won't drift because inner width is constant */}
      <div className="mx-auto flex items-center justify-center gap-3">
        {/* Prev (fixed position) */}
        <button
          type="button"
          onClick={goPrev}
          disabled={page === 0}
          aria-label="Previous page"
          className={`w-10 h-10 shrink-0 rounded-full border text-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            page === 0
              ? "opacity-40 cursor-not-allowed"
              : "bg-white border-gray-300 hover:bg-gray-300 active:bg-gray-200"
          }`}
        >
          &lsaquo;
        </button>

        {/* Center group with fixed width */}
        <div
          className="flex items-center justify-center gap-2 tabular-nums overflow-hidden p-1"
          style={{
            minWidth: worstCaseTokens * 40 + (worstCaseTokens - 1) * GAP_PX,
            maxWidth: "100%", // never overflow screen
          }}
        >
          {tokens.map((t, idx) =>
            t === "left-ellipsis" || t === "right-ellipsis" ? (
              <span
                key={`${t}-${idx}`}
                className="w-10 h-10 flex items-center justify-center text-gray-400 select-none"
              >
                …
              </span>
            ) : (
              <button
              key={t}
              type="button"
              onClick={() => setPage(t)}
              aria-label={`Page ${t + 1}`}
              aria-current={page === t ? "page" : undefined}
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                page === t
                  ? "bg-blue-600 border-blue-600 text-white text-md font-semibold shadow-sm scale-105"
                  : "bg-white border-gray-300 text-gray-700 text-sm hover:bg-gray-100 active:scale-110 active:bg-gray-200"
              }`}
            >
              {t + 1}
            </button>
            )
          )}
        </div>

        {/* Next (fixed position) */}
        <button
          type="button"
          onClick={goNext}
          disabled={page === totalPages - 1}
          aria-label="Next page"
          className={`w-10 h-10 shrink-0 rounded-full border text-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            page === totalPages - 1
              ? "opacity-40 cursor-not-allowed"
              : "bg-white border-gray-300 hover:bg-gray-300 active:bg-gray-200"
          }`}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}