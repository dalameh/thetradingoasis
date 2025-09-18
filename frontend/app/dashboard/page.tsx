'use client';

import React, { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { WidgetManager } from "@/components/dashboard/WidgetManager";
import { StatsWidget } from "@/components/dashboard/StatsWidget";
import { AVAILABLE_WIDGETS } from "@/components/dashboard/availableWidget";
import { toast } from "sonner";
import PageHeader from '@/components/PageHeader'
import { Edit, Check } from "lucide-react";
import {supabase} from "@/lib/supabaseFrontendClient"
import {TradeInsert} from "@/components/DiaryClient/TradeForm"
type Section = "stats" | "main";

const DEFAULT_STATS = ["profit-factor", "win-rate", "avg-pnl-return", "total-trades"];
const DEFAULT_MAIN = ["watchlist", "daily-pnl-chart", "pnl-calender", "quick-actions", "eps-dates"];

export default function Dashboard() {
  const [isEditing, setIsEditing] = useState(false);
  const [managerOpenFor, setManagerOpenFor] = useState<Section | null>(null);
  const [statsWidgets, setStatsWidgets] = useState<string[]>([]);
  const [mainWidgets, setMainWidgets] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [trades, setTrades] = useState<TradeInsert[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Track mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Resolve user or guest ---
  useEffect(() => {
    if (!mounted) return;

    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        // ✅ Authenticated user
        const user = data.session.user;
        setUsername(user.user_metadata?.username ?? "");
        setIsGuest(false);
        setUserId(user.id);
      } else {
        // ✅ Guest fallback
        const guest = sessionStorage.getItem("authenticated") === "guest";
        if (guest) {
          setUsername(sessionStorage.getItem("guest_username") ?? "Guest");
          setIsGuest(true);
          setUserId(sessionStorage.getItem("guestId")); // guestId is stored already
        } else {
          setUsername("");
          setIsGuest(false);
          setUserId(null);
        }
      }

      setLoading(false);
    };

    fetchUser();
  }, [mounted]);

// --- Fetch widgets ---
useEffect(() => {
  if (!mounted || loading || !userId) return;

  const fetchWidgets = async () => {
    if (!isGuest) {
      const { data, error } = await supabase
        .from("dashboard")
        .select("stats_widgets, main_widgets")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No row → insert defaults
          await supabase.from("dashboard").insert({
            user_id: userId,
            stats_widgets: DEFAULT_STATS,
            main_widgets: DEFAULT_MAIN,
          });
          setStatsWidgets(DEFAULT_STATS);
          setMainWidgets(DEFAULT_MAIN);
        } else {
          console.error("Error fetching dashboard widgets:", error);
        }
      } else if (data) {
        setStatsWidgets(
          Array.isArray(data.stats_widgets) && data.stats_widgets.length
            ? data.stats_widgets
            : DEFAULT_STATS
        );
        setMainWidgets(
          Array.isArray(data.main_widgets) && data.main_widgets.length
            ? data.main_widgets
            : DEFAULT_MAIN
        );
      }
    } else {
      // Guest → sessionStorage
      const storedStats = JSON.parse(sessionStorage.getItem("stats_widgets") || "[]");
      const storedMain = JSON.parse(sessionStorage.getItem("main_widgets") || "[]");

      setStatsWidgets(storedStats.length ? storedStats : DEFAULT_STATS);
      setMainWidgets(storedMain.length ? storedMain : DEFAULT_MAIN);
    }

    // ✅ mark that we’ve done the first load
    setHasLoaded(true);
  };

  fetchWidgets();
}, [isGuest, userId, mounted, loading]);

// --- Persist widgets ---
useEffect(() => {
  if (!mounted || loading || !userId || !hasLoaded) return;

  const saveWidgets = async () => {
    if (!isGuest) {
      await supabase.from("dashboard").upsert({
        user_id: userId,
        stats_widgets: [...statsWidgets],
        main_widgets: [...mainWidgets],
        updated_at: new Date().toISOString(),
      });
    } else {
      sessionStorage.setItem("authenticated", "guest");
      sessionStorage.setItem("guestId", userId);
      sessionStorage.setItem("stats_widgets", JSON.stringify(statsWidgets));
      sessionStorage.setItem("main_widgets", JSON.stringify(mainWidgets));
    }
  };

  saveWidgets();
}, [statsWidgets, mainWidgets, isGuest, userId, mounted, loading, hasLoaded]);

  useEffect(() => {
  const fetchTrades = async () => {
   const { data, error } = await supabase.auth.getUser();

  const user = data?.user;

  // Treat "no user" as not an error for guest purposes
  const isGuest = !user && sessionStorage.getItem("authenticated") === "guest";
  const guestId = sessionStorage.getItem("guestId");

  if (!user && (!isGuest || !guestId)) {
    toast.error("You must be logged in or have a valid guest ID to see trades.");
    setTrades([]);
    setLoading(false);
    return;
  }

    let tradesData: TradeInsert[] = [];

    if (user) {
      // Logged-in user: fetch from Supabase
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch trades");
      } else {
        tradesData = data;
      }
    } else if (isGuest && guestId) {
      // Guest user: fetch from sessionStorage
      const storedTrades = sessionStorage.getItem("trades");
      tradesData = storedTrades ? JSON.parse(storedTrades) : [];
    }

    setTrades(tradesData);
    setLoading(false);
  };

  fetchTrades();
}, [mounted]);



  const findWidgetMeta = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id);
  const MAX_MAIN_ROWS = 3;

  const packedMainRows = useMemo(() => {
    type Cell = null | { id: string; span: number; start: boolean };
    const rows: Cell[][] = [];

    const placeWidgetInRows = (widgetId: string, spanIn: number, rowSpanIn: number = 1) => {
      const span = Math.min(Math.max(spanIn, 1), 3);
      const rowSpan = Math.min(Math.max(rowSpanIn, 1), 2);

      for (let r = 0; r < rows.length; r++) {
        // const row = rows[r];
        for (let start = 0; start <= 3 - span; start++) {
          let ok = true;
          for (let rr = 0; rr < rowSpan; rr++) {
            if (r + rr >= MAX_MAIN_ROWS) { ok = false; break; }
            const checkRow = rows[r + rr] ?? [null, null, null];
            for (let k = start; k < start + span; k++) {
              if (checkRow[k] !== null) { ok = false; break; }
            }
            if (!ok) break;
          }
          if (!ok) continue;

          for (let rr = 0; rr < rowSpan; rr++) {
            if (!rows[r + rr]) rows[r + rr] = [null, null, null];
            const markRow = rows[r + rr];
            markRow[start] = { id: widgetId, span, start: rr === 0 };
            for (let k = start + 1; k < start + span; k++) markRow[k] = { id: widgetId, span, start: false };
          }
          return;
        }
      }

      if (rows.length >= MAX_MAIN_ROWS) return;
      const newRow: Cell[] = [null, null, null];
      newRow[0] = { id: widgetId, span, start: true };
      for (let k = 1; k < span; k++) newRow[k] = { id: widgetId, span, start: false };
      rows.push(newRow);

      if (rowSpan > 1 && rows.length < MAX_MAIN_ROWS) {
        const nextRow: Cell[] = [null, null, null];
        for (let k = 0; k < span; k++) nextRow[k] = { id: widgetId, span, start: false };
        rows.push(nextRow);
      }
    };

    mainWidgets.forEach(id => {
      const meta = findWidgetMeta(id);
      const span = meta?.span ?? 1;
      const rowSpan = meta?.rowSpan ?? 1;
      placeWidgetInRows(id, span, rowSpan);
    });

    return rows;
  }, [mainWidgets]);

  // const lastRowRemainingCols = useMemo(() => {
  //   if (packedMainRows.length === 0) return 3;
  //   const last = packedMainRows[packedMainRows.length - 1];
  //   return last.filter(c => c === null).length;
  // }, [packedMainRows]);
  
  const toggleWidgetFor = (section: Section, widgetId: string) => {
    const meta = findWidgetMeta(widgetId);
    if (!meta) return;

    if (section === "stats") {
      setStatsWidgets(prev =>
        prev.includes(widgetId) ? prev.filter(x => x !== widgetId) : [...prev, widgetId].slice(0, 4)
      );
      setManagerOpenFor(null);
      return;
    }

    if (section === "main") {
      if (mainWidgets.includes(widgetId)) {
        setMainWidgets(prev => prev.filter(x => x !== widgetId));
        setManagerOpenFor(null);
        return;
      }

      if ((meta.span ?? 1) > 3) {
        toast.error("This widget spans too many columns for the main grid.");
        return;
      }

      const testWidgets = [...mainWidgets, widgetId];
      const testRows: (null | { id: string; span: number; start: boolean })[][] = [];

      const placeWidgetInRows = (widgetId: string, spanIn: number, rowSpanIn: number = 1) => {
        const span = Math.min(Math.max(spanIn, 1), 3);
        const rowSpan = Math.min(Math.max(rowSpanIn, 1), 2);

        for (let r = 0; r < testRows.length; r++) {
          // const row = testRows[r];
          for (let start = 0; start <= 3 - span; start++) {
            let ok = true;
            for (let rr = 0; rr < rowSpan; rr++) {
              if (r + rr >= MAX_MAIN_ROWS) { ok = false; break; }
              const checkRow = testRows[r + rr] ?? [null, null, null];
              for (let k = start; k < start + span; k++) {
                if (checkRow[k] !== null) { ok = false; break; }
              }
              if (!ok) break;
            }
            if (!ok) continue;

            for (let rr = 0; rr < rowSpan; rr++) {
              if (!testRows[r + rr]) testRows[r + rr] = [null, null, null];
              const markRow = testRows[r + rr];
              markRow[start] = { id: widgetId, span, start: rr === 0 };
              for (let k = start + 1; k < start + span; k++) markRow[k] = { id: widgetId, span, start: false };
            }
            return true;
          }
        }

        if (testRows.length + rowSpan > MAX_MAIN_ROWS) return false;

        for (let rr = 0; rr < rowSpan; rr++) {
          const newRow: typeof testRows[number] = [null, null, null];
          if (rr === 0) {
            newRow[0] = { id: widgetId, span, start: true };
            for (let k = 1; k < span; k++) newRow[k] = { id: widgetId, span, start: false };
          } else {
            for (let k = 0; k < span; k++) newRow[k] = { id: widgetId, span, start: false };
          }
          testRows.push(newRow);
        }
        return true;
      };

      let fits = true;
      for (const id of testWidgets) {
        const m = findWidgetMeta(id);
        if (!placeWidgetInRows(id, m?.span ?? 1, m?.rowSpan ?? 1)) {
          fits = false;
          break;
        }
      }

      if (!fits) {
        toast.error("Not enough space to add this widget.");
        return;
      }

      setMainWidgets(testWidgets);
      setManagerOpenFor(null);
    }
  };

  const onDragStart = (e: React.DragEvent, section: Section, index: number) => {
    if (!isEditing) return;
    e.dataTransfer.setData("application/json", JSON.stringify({ section, index }));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => { if (!isEditing) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const reorder = (arr: string[], from: number, to: number) => { const next = [...arr]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; };
  const onDrop = (e: React.DragEvent, section: Section, dropIndex: number) => {
    if (!isEditing) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.section !== section) return;
    const fromIndex: number = parsed.index;
    if (section === "stats") setStatsWidgets(prev => reorder(prev, fromIndex, dropIndex));
    else setMainWidgets(prev => reorder(prev, fromIndex, Math.min(dropIndex, prev.length)));
  };

  const statsPlaceholders = Math.max(0, 4 - statsWidgets.length);

  // 🔹 If not mounted, render placeholders only
  if (!mounted) {
    return (
      <main>
        <PageHeader title="Your Dashboard"/>
        <div className="min-h-screen bg-white p-4">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-25 rounded-lg bg-gray-200 animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 auto-rows-[240px]">
            {Array.from({ length: 3*3 }).map((_, i) => (
              <div key={i} className="h-60 rounded-lg bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title="Your Dashboard"/>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Header */}
        <div className="flex items-center pl-2 justify-between pb-3">
          <span className = "text-sm text-black"> {username ? `Welcome ${username}!` : `Welcome!`}</span>
          <button
            onClick={() => setIsEditing(prev => !prev)}
            className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isEditing ? <Check className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            <span className = "text-sm">{isEditing ? "Done" : "Edit Widgets"}</span>
          </button>
        </div>
        
        {/* STATS ROW */}
        <section className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {statsWidgets.map((id, idx) => (
              <div key={id} draggable={isEditing} onDragStart={e => onDragStart(e, "stats", idx)} onDragOver={onDragOver} onDrop={e => onDrop(e, "stats", idx)}
                className={`relative p-3 ${isEditing ? "transform hover:scale-101" : ""} rounded-lg border bg-white shadow-sm ${isEditing ? "cursor-move" : "cursor-default"} transition-all h-25`}>
                {isEditing && <button onClick={() => toggleWidgetFor("stats", id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 border text-red-600 hover:bg-red-50" title="Remove"><X className="w-4 h-4"/></button>}
                <StatsWidget widgetId={id} trades = {trades} />
              </div>
            ))}

            {isEditing && Array.from({ length: statsPlaceholders }).map((_, i) => (
              <div key={`stats-ph-${i}`} onClick={() => setManagerOpenFor("stats")} onDragOver={onDragOver} onDrop={e => onDrop(e, "stats", statsWidgets.length + i)}
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100 h-25">
                <div className="text-sm">+ Add Widget</div>
              </div>
            ))}
          </div>
        </section>

        {/* MAIN ROW */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-[240px]"> {/* auto-rows sets base row height */}
            {packedMainRows.length === 0 ? (
              // placeholders
              isEditing && (
                <div
                  onClick={() => setManagerOpenFor("main")}
                  className="col-span-3 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100"
                >
                  <div className="text-lg">+ Add Widget</div>
                </div>
              )
            ) : (
              // widgets
              packedMainRows.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  if (cell === null) {
                    return isEditing ? (
                      <div
                        key={`main-row-${rowIdx}-ph-${colIdx}`}
                        onClick={() => setManagerOpenFor("main")}
                        onDragOver={onDragOver}
                        onDrop={e => onDrop(e, "main", mainWidgets.length)}
                        className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100"
                      >
                        <div className="text-sm">+ Add Widget</div>
                      </div>
                    ) : null;
                  }
                  if (!cell.start) return null;

                  const meta = findWidgetMeta(cell.id);
                  const colSpanClass = cell.span === 1 ? "col-span-1" : cell.span === 2 ? "col-span-2" : "col-span-3";
                  const rowSpanClass = meta?.rowSpan === 2 ? "row-span-2" : "row-span-1";
                  const arrIndex = mainWidgets.indexOf(cell.id);

                  return (
                    <div
                      key={`main-row-${rowIdx}-w-${cell.id}`}
                      draggable={isEditing}
                      onDragStart={e => onDragStart(e, "main", arrIndex)}
                      onDragOver={onDragOver}
                      onDrop={e => onDrop(e, "main", arrIndex)}
                      className={`relative p-4 ${isEditing ? "transform hover:scale-101" : ""} rounded-xl border bg-white shadow-sm ${isEditing ? "cursor-move" : "cursor-default"} transition-all ${colSpanClass} ${rowSpanClass}`}
                    >
                      {isEditing && (
                        <button
                          onClick={() => toggleWidgetFor("main", cell.id)}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 border text-red-600 hover:bg-red-50"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      <div className="text-gray-900 font-medium mb-2">{meta?.title}</div>

                      {/* header */}                      
                      {/* If component exists, render it; else show title/desc */}
                      {meta?.component ? (
                        meta.component({ editing: isEditing, trades: trades })
                      ) : (
                        <>
                          <div className="text-sm text-gray-500 mt-2">{meta?.description}</div>
                        </>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* bottom full-width placeholder */}
            {isEditing &&
              packedMainRows.length < MAX_MAIN_ROWS &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`main-bottom-ph-${i}`}
                  onClick={() => setManagerOpenFor("main")}
                  className="col-span-1 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100"
                >
                  <div className="text-lg">+ Add Widget</div>
                </div>
              ))}
          </div>
        </section>


        {managerOpenFor && 
        <WidgetManager  
          allActiveWidgets={mainWidgets}   // ✅ add this
          activeWidgets={managerOpenFor === "stats" ? statsWidgets : mainWidgets} 
          onToggleWidget={widgetId => toggleWidgetFor(managerOpenFor, widgetId)} 
          onToggleManager={() => setManagerOpenFor(null)} 
          allowedCategory={managerOpenFor === "stats" ? "Analytics" : null} 
          />
        }
      </div>
    </main>
  );
}
