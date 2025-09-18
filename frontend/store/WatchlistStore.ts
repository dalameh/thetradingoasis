import { create } from "zustand";
import { supabase } from "@/lib/supabaseFrontendClient";
import { WSManager } from "@/lib/wsManager";
import { toast } from "sonner";
import { getTicker } from "@/components/ChartClient/Chart";
import Holidays from "date-holidays";

export type Ticker = {
  ticker: string;
  name: string;
  price: number;
  oldPrice: number;
  changePct: number;
  sparkline: number[];
};

type WatchlistState = {
  userId: string | null;
  watchlist: Ticker[];
  wsManager: WSManager | null;
  loading: boolean;

  setUserId: (id: string | null) => void;
  setWatchlist: (list: Ticker[]) => void;
  clearWS: () => void;
  initWS: () => Promise<void>;
  loadWatchlist: () => Promise<void>;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => Promise<void>;
};

// Finnhub types
type FinnhubUpdate = { p: number; s: string; t: number; v: number };
type FinnhubMessage = { data: FinnhubUpdate[]; type: string };

const symbolMap: Record<string, string> = {
  "^GSPC": "OANDA:SPX500_USD",
  "^DJI": "OANDA:US30_USD",
  "^IXIC": "OANDA:NAS100_USD",
  "^RUT": "OANDA:US2000_USD",
};

const hd = new Holidays("US");
const holidayCache: Record<number, Set<string>> = {};

export function getESTDate(date: Date = new Date()): Date {
  const estString = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(estString);
}

export function formatDateEST(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function getHolidaySet(year: number): Set<string> {
  const holidays = hd.getHolidays(year);
  return new Set(holidays.map(h => formatDateEST(new Date(h.date))));
}

export function isTradingDay(date: Date): boolean {
  const estDate = getESTDate(date);
  const day = estDate.getDay();
  if (day === 0 || day === 6) return false;
  const year = estDate.getFullYear();
  if (!holidayCache[year]) holidayCache[year] = getHolidaySet(year);
  return !holidayCache[year].has(formatDateEST(estDate));
}

export function getPreviousTradingDay(date: Date = new Date()): Date {
  const d = getESTDate(date);
  d.setDate(d.getDate() - 1);
  while (!isTradingDay(d)) d.setDate(d.getDate() - 1);
  return d;
}

export async function fetchPreviousClose(ticker: string): Promise<number> {
  try {
    const prevDay = getPreviousTradingDay();
    const nextDay = new Date(prevDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const url = new URL("/api/yfinance", window.location.origin);
    url.searchParams.append("ticker", ticker);
    url.searchParams.append("interval", "1d");
    url.searchParams.append("start", formatDateEST(prevDay));
    url.searchParams.append("end", formatDateEST(nextDay));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch previous close");
    const data = await res.json();
    return Array.isArray(data) && data.length ? data[0].close : 0;
  } catch (err) {
    console.warn(`Error fetching previous close for ${ticker}:`, err);
    return -1;
  }
}

export async function fetchNewPrice(ticker: string): Promise<number> {
  try {
    const now = getESTDate();
    const tradingDay = isTradingDay(now);

    const marketOpen = new Date(now);
    marketOpen.setHours(9, 30, 0, 0);

    const marketClose = new Date(now);
    marketClose.setHours(16, 0, 0, 0);

    let interval = "1d";
    let start: string;
    let end: string;

    if (tradingDay && now >= marketOpen && now < marketClose) {
      interval = "1m";
      start = formatDateEST(now);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      end = formatDateEST(tomorrow);
    } else if (tradingDay && now >= marketClose) {
      start = formatDateEST(now);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      end = formatDateEST(tomorrow);
    } else {
      const prevDay = getPreviousTradingDay(now);
      const nextDay = new Date(prevDay);
      nextDay.setDate(nextDay.getDate() + 1);
      start = formatDateEST(prevDay);
      end = formatDateEST(nextDay);
    }

    const url = new URL("/api/yfinance", window.location.origin);
    url.searchParams.append("ticker", ticker);
    url.searchParams.append("interval", interval);
    url.searchParams.append("start", start);
    url.searchParams.append("end", end);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch price data");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return 0;

    return interval === "1d" ? data[0].close : data[data.length - 1].close;
  } catch (err) {
    console.warn(`Error fetching price for ${ticker}:`, err);
    return -1;
  }
}

// --- Zustand store ---
export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  userId: null,
  watchlist: [],
  wsManager: null,
  loading: false,

  setUserId: (userId) => set({ userId }),

  setWatchlist: (list: Ticker[]) => set({ watchlist: list }),

  clearWS: () => {
    const { wsManager } = get();
    if (wsManager) wsManager.close();
    set({ wsManager: null });
  },

  initWS: async () => {
    if (get().wsManager) return;

    const manager = new WSManager();
    await manager.init();

    // Always update tickers in watchlist when WS messages arrive
    manager.addListener((data: unknown) => {
      const typedData = data as FinnhubMessage;
      if (!typedData.data) return;

      set({
        watchlist: get().watchlist.map((t) => {
          const finnhubSymbol = symbolMap[t.ticker] || t.ticker;
          const update = typedData.data.find((u) => u.s === finnhubSymbol);
          if (update) {
            const newPrice = update.p;
            const changePct = t.oldPrice > 0 ? ((newPrice - t.oldPrice) / t.oldPrice) * 100 : 0;
            return {
              ...t,
              price: newPrice,
              changePct,
              sparkline: [...t.sparkline.slice(-20), newPrice],
            };
          }
          return t;
        }),
      });
    });

    set({ wsManager: manager });

    // Subscribe existing tickers
    get().watchlist.forEach((t) => {
      const symbol = symbolMap[t.ticker] || t.ticker;
      manager.subscribe(symbol);
    });
  },

  loadWatchlist: async () => {
    const { userId, wsManager } = get();
    if (!userId) return;

    set({ loading: true });

    const isGuest = sessionStorage.getItem("authenticated") === "guest";
    const watchlistKey = `watchlist_${userId}`;

    if (isGuest) {
      const stored = sessionStorage.getItem(watchlistKey);
      const parsed: Ticker[] = stored ? JSON.parse(stored) : [];
      set({ watchlist: parsed });

      // Subscribe WS for guest tickers
      if (wsManager) {
        parsed.forEach((t) => wsManager.subscribe(symbolMap[t.ticker] || t.ticker));
      }

      set({ loading: false });
      return;
    }

    // Authenticated user
    const { data: rows } = await supabase.from("watchlist").select("ticker,name").eq("user_id", userId);

    if (rows) {
      for (const row of rows) {
        const ticker = getTicker(row.ticker);
        const oldPrice = await fetchPreviousClose(ticker);
        if (oldPrice === -1) continue;
        const newPrice = await fetchNewPrice(ticker);
        const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

        const item: Ticker = { ticker, name: row.name, price: newPrice, oldPrice, changePct, sparkline: [oldPrice, newPrice] };
        set({ watchlist: [...get().watchlist, item] });

        wsManager?.subscribe(symbolMap[ticker] || ticker);
      }
    }

    set({ loading: false });
  },

  addTicker: async (ticker: string) => {
    const { watchlist, userId, wsManager } = get();
    if (!userId) return;

    const newTicker = getTicker(ticker);
    if (watchlist.some((t) => t.ticker === newTicker)) {
      toast.error(`${newTicker} is already in your watchlist`);
      return;
    }

    let name = newTicker;
    try {
      const res = await fetch(`/api/ticker-name?ticker=${newTicker}`);
      if (res.ok) {
        const data = await res.json();
        if (data.name) name = data.name;
      }
    } catch {}

    const oldPrice = await fetchPreviousClose(newTicker);
    if (oldPrice === -1) {
      toast.error(`${newTicker} not listed`);
      return;
    }
    const newPrice = await fetchNewPrice(newTicker);
    const changePct = ((newPrice - oldPrice) / oldPrice) * 100;

    const newItem: Ticker = { ticker: newTicker, name, price: newPrice, oldPrice, changePct, sparkline: [oldPrice, newPrice] };

    const isGuest = sessionStorage.getItem("authenticated") === "guest";
    if (isGuest) {
      const key = `watchlist_${userId}`;
      const stored = sessionStorage.getItem(key);
      const parsed: Ticker[] = stored ? JSON.parse(stored) : [];
      const updated = [...parsed, newItem];
      sessionStorage.setItem(key, JSON.stringify(updated));
      set({ watchlist: updated });

      // Subscribe WS immediately
      wsManager?.subscribe(symbolMap[newItem.ticker] || newItem.ticker);

      toast.success(`${newTicker} added!`);
      return;
    }

    // Authenticated user → insert Supabase
    await supabase.from("watchlist").insert({ user_id: userId, ticker: newTicker, name });
    set({ watchlist: [...watchlist, newItem] });

    wsManager?.subscribe(symbolMap[newItem.ticker] || newItem.ticker);
    toast.success(`${newTicker} added!`);
  },

  removeTicker: async (ticker: string) => {
    const { watchlist, userId, wsManager } = get();
    if (!userId) return;

    const isGuest = sessionStorage.getItem("authenticated") === "guest";
    if (isGuest) {
      const key = `watchlist_${userId}`;
      const stored = sessionStorage.getItem(key);
      const parsed: Ticker[] = stored ? JSON.parse(stored) : [];
      const updated = parsed.filter(t => t.ticker !== ticker);
      sessionStorage.setItem(key, JSON.stringify(updated));
      set({ watchlist: updated });

      // Unsubscribe WS immediately
      wsManager?.unsubscribe(symbolMap[ticker] || ticker);

      toast.success(`${ticker} removed`);
      return;
    }

    // Authenticated user
    await supabase.from("watchlist").delete().eq("user_id", userId).eq("ticker", ticker);
    set({ watchlist: watchlist.filter((t) => t.ticker !== ticker) });
    wsManager?.unsubscribe(symbolMap[ticker] || ticker);
    toast.success(`${ticker} removed`);
  },
}));



// import { create } from "zustand";
// import { supabase } from "@/lib/supabaseFrontendClient";
// import { WSManager } from "@/lib/wsManager";
// import { toast } from "sonner";
// import { getTicker } from "@/components/ChartClient/Chart";
// import Holidays from "date-holidays";

// export type Ticker = {
//   ticker: string;
//   name: string;
//   price: number;
//   oldPrice: number;
//   changePct: number;
//   sparkline: number[];
// };

// type WatchlistState = {
//   userId: string | null;
//   watchlist: Ticker[];
//   wsManager: WSManager | null;
//   loading: boolean;

//   setUserId: (id: string | null) => void;
//   setWatchlist: (list: Ticker[]) => void;
//   clearWS: () => void;
//   initWS: () => Promise<void>;
//   loadWatchlist: () => Promise<void>;
//   addTicker: (ticker: string) => Promise<void>;
//   removeTicker: (ticker: string) => Promise<void>;
// };

// // Define the types
// type FinnhubUpdate = {
//   p: number;       // price
//   s: string;       // symbol
//   t: number;       // timestamp
//   v: number;       // volume
// };

// type FinnhubMessage = {
//   data: FinnhubUpdate[];
//   type: string;
// };

// const symbolMap: Record<string, string> = {
//   "^GSPC": "OANDA:SPX500_USD",
//   "^DJI": "OANDA:US30_USD",
//   "^IXIC": "OANDA:NAS100_USD",
//   "^RUT": "OANDA:US2000_USD",
// };

// const hd = new Holidays("US");
// const holidayCache: Record<number, Set<string>> = {};

// // --- Utilities ---
// export function getESTDate(date: Date = new Date()): Date {
//   // Convert any date to EST, keeping wall time correct
//   const estString = date.toLocaleString("en-US", { timeZone: "America/New_York" });
//   return new Date(estString);
// }

// export function formatDateEST(date: Date = new Date()): string {
//   return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
// }

// function getHolidaySet(year: number): Set<string> {
//   const holidays = hd.getHolidays(year);
//   return new Set(holidays.map((h) => formatDateEST(new Date(h.date))));
// }

// export function isTradingDay(date: Date): boolean {
//   const estDate = getESTDate(date);
//   const day = estDate.getDay();
//   if (day === 0 || day === 6) return false; // weekend

//   const year = estDate.getFullYear();
//   if (!holidayCache[year]) holidayCache[year] = getHolidaySet(year);

//   const dateStr = formatDateEST(estDate);
//   return !holidayCache[year].has(dateStr);
// }

// // --- Trading day helpers ---
// export function getPreviousTradingDay(date: Date = new Date()): Date {
//   const d = getESTDate(date);
//   d.setDate(d.getDate() - 1);
//   while (!isTradingDay(d)) d.setDate(d.getDate() - 1);
//   return d;
// }

// // --- Price fetch helpers ---
// export async function fetchPreviousClose(ticker: string): Promise<number> {
//   try {
//     const prevDay = getPreviousTradingDay(); // Date in EST
//     const nextDay = new Date(prevDay);
//     nextDay.setDate(nextDay.getDate() + 1);

//     const url = new URL("/api/yfinance", window.location.origin);
//     url.searchParams.append("ticker", ticker);
//     url.searchParams.append("interval", "1d");
//     url.searchParams.append("start", formatDateEST(prevDay));
//     url.searchParams.append("end", formatDateEST(nextDay));

//     const res = await fetch(url.toString());
//     if (!res.ok) throw new Error("Failed to fetch previous close");
//     const data = await res.json();
//     return Array.isArray(data) && data.length ? data[0].close : 0;
//   } catch (err) {
//     console.warn(`Error fetching previous close for ${ticker}:`, err);
//     return -1;
//   }
// }

// export async function fetchNewPrice(ticker: string): Promise<number> {
//   try {
//     const now = getESTDate();
//     const tradingDay = isTradingDay(now);

//     const marketOpen = new Date(now);
//     marketOpen.setHours(9, 30, 0, 0);

//     const marketClose = new Date(now);
//     marketClose.setHours(16, 0, 0, 0);

//     let interval = "1d";
//     let start: string;
//     let end: string;

//     if (tradingDay && now >= marketOpen && now < marketClose) {
//       // Market open → 1m interval
//       interval = "1m";
//       start = formatDateEST(now);
//       const tomorrow = new Date(now);
//       tomorrow.setDate(tomorrow.getDate() + 1);
//       end = formatDateEST(tomorrow);
//     } else if (tradingDay && now >= marketClose) {
//       // Market closed → after hours
//       start = formatDateEST(now);
//       const tomorrow = new Date(now);
//       tomorrow.setDate(tomorrow.getDate() + 1);
//       end = formatDateEST(tomorrow);
//     } else {
//       // Pre-market → use previous trading day
//       const prevDay = getPreviousTradingDay(now);
//       const nextDay = new Date(prevDay);
//       nextDay.setDate(nextDay.getDate() + 1);
//       start = formatDateEST(prevDay);
//       end = formatDateEST(nextDay);
//     }

//     const url = new URL("/api/yfinance", window.location.origin);
//     url.searchParams.append("ticker", ticker);
//     url.searchParams.append("interval", interval);
//     url.searchParams.append("start", start);
//     url.searchParams.append("end", end);

//     const res = await fetch(url.toString());
//     if (!res.ok) throw new Error("Failed to fetch price data");
//     const data = await res.json();
//     if (!Array.isArray(data) || data.length === 0) return 0;

//     return interval === "1d" ? data[0].close : data[data.length - 1].close;
//   } catch (err) {
//     console.warn(`Error fetching price for ${ticker}:`, err);
//     return -1;
//   }
// }

// // ----- Zustand store -----

// export const useWatchlistStore = create<WatchlistState>((set, get) => ({
//   userId: null,
//   watchlist: [],
//   wsManager: null,
//   loading: false,

//   setUserId: (userId) => set({ userId }),

//   setWatchlist: (list: Ticker[]) => set({ watchlist: list }),

//   clearWS: () => {
//     const { wsManager } = get();
//     if (wsManager) {
//       wsManager.close();
//     }
//     set({ wsManager: null });
//   },

//   initWS: async () => {
//     if (get().wsManager) return;

//     const manager = new WSManager();
//     await manager.init();

//     manager.addListener((data: unknown) => {
//       const typedData = data as FinnhubMessage;
//       if (!typedData.data) return;
      
//       set({
//         watchlist: get().watchlist.map((t) => {
//           const finnhubSymbol = symbolMap[t.ticker] || t.ticker;
//           const typedData = data as { data: FinnhubUpdate[] }; // assert type

//           const update = typedData.data.find((u: any) => u.s === finnhubSymbol);
//           if (update) {
//             const newPrice = update.p;
//             const changePct = t.oldPrice > 0 ? ((newPrice - t.oldPrice) / t.oldPrice) * 100 : 0;
//             return {
//               ...t,
//               price: newPrice,
//               changePct,
//               sparkline: [...t.sparkline.slice(-20), newPrice],
//             };
//           }
//           return t;
//         }),
//       });
//     });

//     set({ wsManager: manager });
//   },

//   loadWatchlist: async () => {
//     const { userId, wsManager } = get();
//     if (!userId) return;

//     set({ loading: true });
//     const { data: rows } = await supabase
//       .from("watchlist")
//       .select("ticker,name")
//       .eq("user_id", userId);

//     if (rows) {
//       for (const row of rows) {
//         const ticker = getTicker(row.ticker);
//         const oldPrice = await fetchPreviousClose(ticker);
//         if (oldPrice === -1) continue;
//         const newPrice = await fetchNewPrice(ticker);
//         const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

//         set({
//           watchlist: [
//             ...get().watchlist,
//             { ticker, name: row.name, price: newPrice, oldPrice, changePct, sparkline: [oldPrice, newPrice] },
//           ],
//         });

//         const finnhubSymbol = symbolMap[ticker] || ticker;
//         wsManager?.subscribe(finnhubSymbol);
//       }
//     }
//     set({ loading: false });
//   },

//   addTicker: async (ticker: string) => {
//     const { watchlist, userId, wsManager } = get();
//     if (!userId) return;

//     const newTicker = getTicker(ticker);
//     if (watchlist.some((t) => t.ticker === newTicker)) {
//       toast.error(`${newTicker} is already in your watchlist`);
//       return;
//     }

//     let name = newTicker;
//     try {
//       const res = await fetch(`/api/ticker-name?ticker=${newTicker}`);
//       if (res.ok) {
//         const data = await res.json();
//         if (data.name) name = data.name;
//       }
//     } catch {}

//     const oldPrice = await fetchPreviousClose(newTicker);
//     if (oldPrice === -1) {
//       toast.error(`${newTicker} not listed`);
//       return;
//     }
//     const newPrice = await fetchNewPrice(newTicker);
//     const changePct = ((newPrice - oldPrice) / oldPrice) * 100;

//     await supabase.from("watchlist").insert({ user_id: userId, ticker: newTicker, name });

//     set({
//       watchlist: [
//         ...watchlist,
//         { ticker: newTicker, name, price: newPrice, oldPrice, changePct, sparkline: [oldPrice, newPrice] },
//       ],
//     });

//     wsManager?.subscribe(symbolMap[newTicker] || newTicker);
//     toast.success(`${newTicker} added!`);
//   },

//   removeTicker: async (ticker: string) => {
//     const { watchlist, userId, wsManager } = get();
//     if (!userId) return;

//     await supabase.from("watchlist").delete().eq("user_id", userId).eq("ticker", ticker);
//     wsManager?.unsubscribe(symbolMap[ticker] || ticker);
//     set({ watchlist: watchlist.filter((t) => t.ticker !== ticker) });
//     toast.success(`${ticker} removed`);
//   },
// }));