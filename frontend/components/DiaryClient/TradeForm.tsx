'use client';

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import Select, { components, SingleValue } from "react-select";
import Chart from '@/components/ChartClient/Chart';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Time } from "lightweight-charts";
import { getTicker } from '@/components/ChartClient/Chart'
import { supabase } from '@/lib/supabaseFrontendClient';
import { ChartLine } from "lucide-react";
import {isTradingDay} from '@/store/WatchlistStore'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

type SetupOption = {
  value: string | null ;
  label: string;
  rules: string[]; // or the actual type of your rules
};

type TradeType = "Stock" | "Options" | "";
interface OptionType {
  value: TradeType;
  label: string;
}

type DirectionType = "Buy Call" | "Buy Put" | "Sell Call" | "Sell Put" | "Long" | "Short" | "";
type OutcomeType = "win" | "loss" | "breakeven" | "";
type StopLossType = "%" | "$";
type PnLType = "%" | "$";

export interface TradeFormData {
  symbol: string;
  type: TradeType;
  direction: DirectionType;
  contractExpDate?: Date | null;
  strikePrice?: number;
  dte?: number;
  entryDate: Date | null ;
  entryTime?: Date | null;
  entryPrice?: number;
  entryPremium?: number;
  shares?: number;
  contracts?: number;
  stillActive: boolean;
  exitDate: Date | null;
  exitTime: Date | null;
  exitPrice?: number;
  exitPremium?: number;
  sharesSold?: number;
  contractsSold?: number;
  totalCost: number | undefined;
  stopLoss: number | undefined;
  stopLossType: string;
  pnl: number | undefined;
  pnlType: PnLType;
  setup: string;
  setupRules: string[],
  notes: string;
}

export interface TradeInsert {
  id: number
  user_id: string;  // required
  symbol: string;
  type: TradeType;
  direction: DirectionType;
  contract_exp_date?: string | null;
  strike_price?: number;
  dte?: number;
  entry_date: string | null;
  entry_time?: string | null;
  entry_price?: number;
  entry_premium?: number;
  shares?: number;
  contracts?: number;
  still_active?: boolean;
  exit_date?: string | null;
  exit_time?: string | null;
  exit_price?: number;
  exit_premium?: number;
  shares_sold?: number;
  contracts_sold?: number;
  total_cost?: number;
  stop_loss?: number;
  stop_loss_type?: string;
  pnl?: number;
  pnl_type?: PnLType;
  setup?: string;
  setup_rules?: string[];
  notes?: string;
  outcome?: OutcomeType;
}

interface Setup {
  id: string;
  name: string;
  rules: string[];
}

// Format date for Supabase (YYYY-MM-DD)
export function formatDateEST(date?: Date | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  // Convert to EST string and take YYYY-MM-DD
  const estDate = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return estDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Format time for Supabase (hh:mm AM/PM)
export function formatTimeEST(time?: Date | null): string | null {
  if (!time) return null;
  const t = new Date(time);
  return t.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }); // "10:45 AM" or "03:30 PM"
}

type TradeFormProps = {
    handleReturn: () => void; 
    onAddTrade: (trade: TradeInsert) => void;
    trade?: TradeInsert | null;
    ticker?: string | null
};

function parseDateEST(dateString?: string | null): Date | null {
  if (!dateString) return null;

  // Create a Date in the "America/New_York" timezone at midnight
  const estDateStr = new Date(dateString + "T00:00:00").toLocaleString("en-US", {
    timeZone: "America/New_York",
  });

  // Convert that back to a Date object
  return new Date(estDateStr);
}

function parseTimeStringToDate(timeString?: string | null): Date | null {
  if (!timeString) return null;

  const match = timeString.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  const [_, hStr, mStr, period] = match;
  let hours = parseInt(hStr);
  const minutes = parseInt(mStr);

  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

export default function TradeForm({ onAddTrade, handleReturn, trade, ticker}: TradeFormProps) {
  // initial "Add Trade" form
  const initialForm: TradeFormData = {
    symbol: trade?.symbol || ticker || "",
    type: trade?.type || "",
    direction: trade?.direction || "",
    contractExpDate: trade?.contract_exp_date ? parseDateEST(trade.contract_exp_date) : null,
    strikePrice: trade?.strike_price,
    dte: trade?.dte,
    entryDate: trade?.entry_date ? parseDateEST(trade.entry_date) : clampEntryDate(new Date()),
    entryTime: parseTimeStringToDate(trade?.entry_time) || null,
    entryPrice: trade?.entry_price,
    entryPremium: trade?.entry_premium,
    shares: trade?.shares,
    contracts: trade?.contracts,
    stillActive: trade?.still_active || false,
    exitDate: trade?.exit_date ? parseDateEST(trade.exit_date) : null,
    exitTime: parseTimeStringToDate(trade?.exit_time) || null,
    exitPrice: trade?.exit_price,
    exitPremium: trade?.exit_premium,
    sharesSold: trade?.shares_sold,
    contractsSold: trade?.contracts_sold,
    totalCost: trade?.total_cost,
    stopLoss: trade?.stop_loss,
    stopLossType: trade?.stop_loss_type || "%",
    pnl: trade?.pnl || undefined,
    pnlType: trade?.pnl_type || "$",
    setup: trade?.setup || "",
    setupRules: trade?.setup_rules || [],
    notes: trade?.notes || "",
  };


  // vars
  // const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<TradeFormData>(initialForm);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<boolean[]>([]);
  const [typicalEntryPrice, setTypicalEntryPrice] = useState<number | null>(null);
  const [typicalExitPrice, setTypicalExitPrice] = useState<number | null>(null);
  const [totalCostEdited, setTotalCostEdited] = useState(false);
  const [entryPriceEdited, setEntryPriceEdited] = useState(false);
  const [exitPriceEdited, setExitPriceEdited] = useState(false);
  const [strikePriceEdited, setStrikePriceEdited] = useState(false);

  // Maintainable Entry and Exit Rows for Both Stock and Option Types
  const entryFieldMap: Record<
    string,
    { label: string; key: keyof typeof formData; specialHandler?: boolean }
  > = {
    Stock: { label: "Entry Price", key: "entryPrice", specialHandler: true },
    Options: { label: "Entry Premium", key: "entryPremium" },
  };

  const quantityEntryFieldMap: Record<
    string,
    { label: string; key: keyof typeof formData; specialHandler?: boolean}
  > = {
    Stock: { label: "Shares Bought", key: "shares", specialHandler: true },
    Options: { label: "Contracts Bought", key: "contracts" },
  };

  const exitFieldMap: Record<string, { label: string; key: keyof typeof formData; specialHandler?: true }> = {
    Stock: { label: "Exit Price", key: "exitPrice", specialHandler: true  },
    Options: { label: "Exit Premium", key: "exitPremium" }
  };

  const quantityExitFieldMap: Record<string, { label: string; key: keyof typeof formData }> = {
    Stock: { label: "Shares Sold", key: "sharesSold" },
    Options: { label: "Contracts Sold", key: "contractsSold" }
  };

  // fetch exisiting setups off the bat
   useEffect(() => {
    const fetchSetups = async () => {
      // get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // toast.error("Could not fetch user");
        // then check if there is a guest
        return;
      }

      // fetch setups for this user
      const { data, error } = await supabase
        .from("playbook_setups")
        .select("id, name, rules")
        .eq("user_id", user.id);

      if (error) {
        // toast.error("Failed to fetch setups");
        return;
      }

      if (data) {
        // make sure rules is parsed as string[]
        const parsedSetups: Setup[] = data.map((s) => ({
          id: s.id,
          name: s.name,
          rules: Array.isArray(s.rules) ? s.rules : [],
        }));
        setSetups(parsedSetups);
      }
    };

    fetchSetups();
  }, []);

   useEffect(() => {
    if (!trade || setups.length === 0) return;

    // Find the setup object that matches the trade's setup name
    const currentSetup = setups.find(s => s.name === trade.setup);

    if (!currentSetup) return;

    // Map the rules to booleans based on what the trade has selected
    const safeCheckedRules = currentSetup.rules.map(rule =>
      trade.setup_rules?.includes(rule) ?? false
    );

    // Update selected setup and rules state
    setSelectedSetupId(currentSetup.id || null); 
    setSelectedRules(safeCheckedRules);

  }, [trade, setups]);




  // handle const functions
  const handleSymbol = (symbol: string) => {
    setFormData(prev => ({
      ...prev,
      symbol: symbol,
    }));
  };

  // --- LOCK ENTRY PRICE WHEN USER EDITS ---
  const handleEntryPriceChange = (value: number | undefined) => {
    // Mark as edited if user touched it (even if they clear to 0/undefined)
    setEntryPriceEdited(true);

    setFormData(prev => ({
      ...prev,
      entryPrice: value,
    }));
  };

  // Reset entryPriceEdited when entry date/time changes
  useEffect(() => {
    if (!formData.type || !typicalEntryPrice) return;
    if (formData.type == "Stock") {
      setEntryPriceEdited(formData.entryPrice != undefined && formData.entryPrice != 0 && (formData.entryPrice !== typicalEntryPrice));
    } else {
      setStrikePriceEdited(formData.strikePrice != undefined && formData.strikePrice != 0 && (formData.strikePrice !== Math.round(typicalEntryPrice)));
    }
  }, [formData.entryDate, formData.entryTime]);


  const handleExitPriceChange = (value: number | undefined) => {
    setExitPriceEdited(true);
    setFormData(prev => ({
      ...prev,
      exitPrice: value,
    }));
  };

  useEffect(() => {
    if (formData.type !== "Stock" || !typicalExitPrice) return;
    setExitPriceEdited(formData.exitPrice != undefined && formData.exitPrice != 0 && (formData.exitPrice !== typicalExitPrice));
  }, [formData.exitDate, formData.exitTime]);


  // --- LOCK STRIKE PRICE WHEN USER EDITS ---
  const handleStrikePriceChange = (value: number | undefined) => {
    setStrikePriceEdited(true);
    setFormData(prev => ({
      ...prev,
      strikePrice: value,
    }));
  };

  const handleSharesChange = (value: number | undefined) => {
    setFormData(prev => {
      const totalCost =
        !totalCostEdited && value !== undefined && prev.entryPrice !== undefined
          ? value * prev.entryPrice
          : prev.totalCost;

      return {
        ...prev,
        shares: value,
        totalCost,
      };
    });
  };


  // --- LOCK TOTAL COST WHEN USER EDITS ---
  const handleTotalCostChange = (value: number | undefined) => {
    if (!formData.type) return;
    setFormData(prev => ({
      ...prev,
      totalCost: value,
    }));
    if (formData.type == "Stock") {
      setTotalCostEdited(value != Number((formData.entryPrice! * formData.shares!).toFixed(2)));
    } else {
      setTotalCostEdited(value != Number((formData.entryPremium! * formData.contracts!).toFixed(2)));
    }
  };

  useEffect(() => {
    if (!formData.type) return;

    if (formData.type == "Stock" && formData.shares && formData.entryPrice) {
      setTotalCostEdited(formData.totalCost != undefined && formData.totalCost != 0 && (formData.totalCost != Number((formData.entryPrice * formData.shares).toFixed(2))));
    } else { 
      if (formData.contracts && formData.entryPremium) {
        setTotalCostEdited(formData.totalCost != undefined && formData.totalCost != 0 && (formData.totalCost != Number((formData.entryPremium * formData.contracts).toFixed(2))));
      }
    }
  }, [formData.shares, formData.contracts]);

  // --- HANDLE SUBMISSION ---
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Guest fallback
  const isGuest = !user && sessionStorage.getItem("authenticated") === "guest";
  const guestId = sessionStorage.getItem("guestId");

  if (!user && (!isGuest || !guestId)) {
    toast.error("You must be logged in or have a valid guest ID to save trades.");
    return;
  }

  const outcome: OutcomeType = formData.pnl
    ? formData.pnl > 0
      ? "win"
      : formData.pnl === 0
      ? "breakeven"
      : "loss"
    : "";

  // 3. Build trade object (without `id`)
  const tradeData = {
    user_id: user ? user.id : guestId!,
    symbol: formData.symbol,
    type: formData.type,
    direction: formData.direction,
    contract_exp_date: formatDateEST(formData.contractExpDate),
    strike_price: formData.strikePrice,
    dte: formData.dte,
    entry_date: formatDateEST(formData.entryDate),
    entry_time: formatTimeEST(formData.entryTime),
    entry_price: formData.entryPrice,
    entry_premium: formData.entryPremium,
    shares: formData.shares,
    contracts: formData.contracts,
    still_active: formData.stillActive,
    exit_date: formatDateEST(formData.exitDate),
    exit_time: formatTimeEST(formData.exitTime),
    exit_price: formData.exitPrice,
    exit_premium: formData.exitPremium,
    shares_sold: formData.sharesSold,
    contracts_sold: formData.contractsSold,
    total_cost: formData.totalCost,
    stop_loss: formData.stopLoss,
    stop_loss_type: formData.stopLossType,
    pnl: formData.pnl,
    pnl_type: formData.pnlType,
    setup: formData.setup,
    setup_rules: formData.setupRules,
    notes: formData.notes,
    outcome: outcome,
  };

  // 4. Handle logged-in user trades
  if (user) {
    let data, error;
    if (trade) {
      // Update existing trade
      ({ data, error } = await supabase
        .from("trades")
        .update(tradeData)
        .eq("id", trade.id)
        .eq("user_id", user.id)
        .select()
        .single());
    } else {
      // Insert new trade (Supabase will generate numeric id)
      ({ data, error } = await supabase
        .from("trades")
        .insert(tradeData)
        .select()
        .single());
    }

    if (error || !data) {
      console.error("Insert error:", error);
      toast.error("Failed to save trade.");
      return;
    }

    // Pass inserted DB trade with numeric id
    onAddTrade({
      ...tradeData,
      id: data.id,
    });

  } 
  // 5. Handle guest trades
  else if (isGuest && guestId) {
    const storedTrades = JSON.parse(sessionStorage.getItem("trades") || "[]");

    // Get last used guest ID (or 0 if none)
    const lastId = Number(sessionStorage.getItem("lastGuestId") || 0);
    const nextId = lastId + 1;
    sessionStorage.setItem("lastGuestId", String(nextId));

    let updatedTrades;

    if (trade) {
      // Update guest trade
      updatedTrades = storedTrades.map((t: TradeInsert) =>
        t.id === trade.id ? { ...tradeData, id: t.id } : t
      );
      onAddTrade({ ...tradeData, id: trade.id });
    } else {
      // Insert new guest trade with numeric ID
      const newTrade: TradeInsert = { ...tradeData, id: nextId };
      updatedTrades = [...storedTrades, newTrade];
      onAddTrade(newTrade);
    }

    sessionStorage.setItem("trades", JSON.stringify(updatedTrades));
  }
  
  toast.success(trade ? "Trade updated" : "Trade added to diary");
  handleReturn();
};


  // --- HANDLE TRADE TYPE CHANGE ---
  const handleTypeChange = (newType: TradeType) => {
    setFormData({
      ...formData,
      type: newType,
      direction: "",
      shares: undefined,
      contracts: undefined,
      entryPrice: undefined,
      entryPremium: undefined,
      exitPrice: undefined,
      exitPremium: undefined,
      totalCost: undefined,
      strikePrice: undefined,
      dte: undefined,
      contractExpDate: null,
      stillActive: false,
      sharesSold: undefined,
      contractsSold: undefined,
      stopLoss: undefined,
      stopLossType: "%",
      pnl: undefined,
      pnlType: "$",
      setup: "",
      setupRules: [],
      notes: "",
    });
    setTotalCostEdited(false);
    setStrikePriceEdited(false);
    setEntryPriceEdited(false);
    setExitPriceEdited(false);
  };

  // ---HANDLE "Still Active" TOGGLE ---
  const handleStillActiveToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      stillActive: checked,
      exitDate: checked ? null : formData.exitDate,
      exitTime: checked ? null : formData.exitTime,
      pnl: checked ? undefined : formData.pnl,

      ...(formData.type === "Stock"
        ? {
            exitPrice: checked ? undefined : formData.exitPrice,
            sharesSold: checked ? undefined : formData.sharesSold,
          }
        : {
            exitPremium: checked ? undefined : formData.exitPremium,
            contractsSold: checked ? undefined : formData.contractsSold,
          }),
    });
  };

  // --- PREVEN DATE FROM BEING SET BEFORE OR AFTER TRADING HOURS ---
  function clampEntryTime(date: Date) {
    if (!date) return;

    const entryTime = new Date(date);

    const minTime = new Date(date);
    minTime.setHours(9, 30, 0, 0); // 9:30 AM

    const maxTime = new Date(date);
    maxTime.setHours(15, 59, 0, 0); // 3:59 PM

    if (entryTime < minTime) return minTime;
    if (entryTime > maxTime) return maxTime;
    return entryTime;
  }
  
  function getNearestTradingDay(date: Date = new Date()): string | null{
    const d = new Date(date);
    if (isTradingDay(d)) return formatDateEST(d);
    d.setDate(d.getDate() - 1);
    while (!isTradingDay(d)) d.setDate(d.getDate() - 1);
    return formatDateEST(d); // use local YYYY-MM-DD
  }
  
  function clampEntryDate(date: Date | null | undefined): Date | null {
    if (!date) return null;
    return new Date(getNearestTradingDay(date) + "T00:00:00"); 
    // ensures midnight local
  }

  /**
   * Calculate DTE (trading days) between entryDate and contractExpDate
   * @param entryDate Date object of entry
   * @param contractExpDate Date object of option expiration
   * @returns number of trading days (DTE)
   */
  const calculateDTE = useCallback((entryDate: Date, expirationDate: Date) => {
    if (formData.type === "Stock") return undefined;
    let dte = 0;
    const current = new Date(entryDate);

    while (current < expirationDate) {
        if (isTradingDay(current)) {
        dte++;
        }
        current.setDate(current.getDate() + 1);
    }

     setFormData(prev => ({
      ...prev,
      dte: dte,
    }));

  }, [formData.type, formData.entryDate, formData.contractExpDate]);

  // ✅ Utility: Merge date + time into UNIX seconds
  const mergeDateTimeToUnix = (date: Date | null, time: Date | null): number | undefined => {
    if (!date) return undefined;
    const merged = new Date(date);
    if (time) {
      merged.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
    } else {
      merged.setHours(0, 0, 0, 0);
    }
    return Math.floor(merged.getTime() / 1000);
  };

  const entryUnix = formData.entryDate
    ? formData.entryTime
      ? mergeDateTimeToUnix(formData.entryDate, formData.entryTime)
      : Math.floor(new Date(formData.entryDate).setHours(0, 0, 0, 0) / 1000)
    : undefined;

  const exitUnix = formData.exitDate
    ? formData.exitTime
      ? mergeDateTimeToUnix(formData.exitDate, formData.exitTime)
      : Math.floor(new Date(formData.exitDate).setHours(23, 59, 59, 999) / 1000)
    : undefined;

    // --------------------
    // FETCH TYPICAL ENTRY & EXIT PRICES
    // --------------------
  useEffect(() => {
    let entryTimeout: NodeJS.Timeout;
    let exitTimeout: NodeJS.Timeout;

    if (formData.symbol && formData.entryDate && formData.entryTime) {
      entryTimeout = setTimeout(async () => {
        try {
          const url = new URL('/api/bar', window.location.origin);
          url.searchParams.append('symbol', getTicker(formData.symbol));
          if (entryUnix) url.searchParams.append('timestamp', entryUnix.toString());
          const res = await fetch(url.toString());
          const data = await res.json();
          const price = Number(((data.high + data.low + data.close) / 3).toFixed(2));
          setTypicalEntryPrice(prev => prev === price ? prev : price);
        } catch { setTypicalEntryPrice(null); }
      }, 1000);
    }

    if (formData.symbol && formData.exitDate && formData.exitTime) {
      exitTimeout = setTimeout(async () => {
        try {
          const url = new URL('/api/bar', window.location.origin);
          url.searchParams.append('symbol', getTicker(formData.symbol));
          if (exitUnix) url.searchParams.append('timestamp', exitUnix.toString());
          const res = await fetch(url.toString());
          const data = await res.json();
          const price = Number(((data.high + data.low + data.close) / 3).toFixed(2));
          setTypicalExitPrice(prev => prev === price ? prev : price);
        } catch { setTypicalExitPrice(null); }
      }, 100);
    }

    return () => {
      clearTimeout(entryTimeout);
      clearTimeout(exitTimeout);
    };
  }, [formData.symbol, formData.type, formData.entryDate, formData.entryTime, formData.exitDate, formData.exitTime, entryUnix, exitUnix]);

  // --------------------
  // AUTO-FILL & CALCULATIONS
  // --------------------
  useEffect(() => {
    setFormData(prev => {
      const updated = { ...prev };

      // ENTRY PRICE (Stock)
      if (formData.type === "Stock" && !entryPriceEdited) {
        if (typicalEntryPrice && updated.entryDate && updated.entryTime) {
          updated.entryPrice = typicalEntryPrice;
        }
      }

      // STRIKE PRICE (Options)
      if (formData.type === "Options" && !strikePriceEdited) {
        if (typicalEntryPrice && updated.entryDate && updated.entryTime) {
          updated.strikePrice = Math.round(typicalEntryPrice);
        }
      }

      // EXIT PRICE (Stock)
      if (formData.type === "Stock" && !exitPriceEdited && !formData.stillActive) {
        if (typicalExitPrice && updated.exitDate && updated.exitTime) {
          updated.exitPrice = typicalExitPrice;
        }
      }

      // TOTAL COST
      if (!totalCostEdited) {
        if (formData.type === "Stock" && updated.entryPrice && updated.shares) {
          updated.totalCost = Number((updated.entryPrice * updated.shares).toFixed(2));
        } else if (formData.type === "Options" && updated.entryPremium && updated.contracts) {
          updated.totalCost = Number(((updated.contracts * updated.entryPremium) * 100).toFixed(3));
        } else {
          updated.totalCost = undefined;
        }
      }

      // DTE
      if (formData.type === "Options" && updated.entryDate && updated.contractExpDate) {
        updated.dte = calculateDTE(updated.entryDate, updated.contractExpDate);
      }

      // LIMIT sharesSold / contractsSold
      if (formData.type === "Stock" && updated.shares && updated.sharesSold !== undefined) {
        updated.sharesSold = Math.min(updated.sharesSold, updated.shares);
      }
      if (formData.type === "Options" && updated.contracts && updated.contractsSold !== undefined) {
        updated.contractsSold = Math.min(updated.contractsSold, updated.contracts);
      }

      // PNL
      if (!updated.stillActive && updated.totalCost !== undefined) {
        if (formData.type === "Stock" && updated.exitPrice !== undefined && updated.sharesSold !== undefined) {
          if (formData.pnlType == "$") {
            updated.pnl = Number(((updated.exitPrice * updated.sharesSold) - updated.totalCost).toFixed(2));
          } else {
            updated.pnl = Number(((((updated.exitPrice * updated.sharesSold) / updated.totalCost) - 1) * 100).toFixed(2));
          }
        } else if (formData.type === "Options" && updated.exitPremium !== undefined && updated.contractsSold !== undefined) {
          if (formData.pnlType == "$") {
            updated.pnl = Number(((updated.exitPremium * updated.contractsSold * 100) - updated.totalCost).toFixed(2));
          } else {
            updated.pnl = Number(((((updated.exitPremium * updated.contractsSold * 100) / updated.totalCost) - 1) * 100).toFixed(2));
          }
        } else updated.pnl = undefined;
      }

      return updated;
    });
  }, [
    typicalEntryPrice,
    typicalExitPrice,
    entryPriceEdited,
    exitPriceEdited,
    strikePriceEdited,
    totalCostEdited,
    formData.type,
    formData.stillActive,
    formData.entryDate,
    formData.entryTime,
    formData.exitDate,
    formData.exitTime,
    formData.entryPrice,
    formData.entryPremium,
    formData.contracts,
    formData.shares,
    formData.contractExpDate,
    formData.sharesSold,
    formData.contractsSold,
    formData.exitPrice,
    formData.exitPremium,
    formData.pnlType,
    formData.pnl,
    calculateDTE
  ]);

  useEffect(() => {
  if (formData.stopLoss && formData.totalCost) {
    setFormData(prev => {
      const updated = { ...prev };

      if (updated.stopLossType === "$") {
        // % → $
        updated.stopLoss = Number((updated.totalCost! * (updated.stopLoss! / 100)).toFixed(2));
      } else {
        // $ → %
        updated.stopLoss = Number(((updated.stopLoss! / updated.totalCost!) * 100).toFixed(2));
      }

      return updated;
    });
  }
}, [formData.stopLossType]);


 // AUTO PNL TYPE CALCULATION: switch between % and $
//   useEffect(() => {
//     if (!formData.totalCost || formData.pnl === undefined) return;

//     const { pnl, totalCost, pnlType } = formData;

//     let newPnl: number | undefined = undefined;

//     if (pnlType === "$") {
//       // convert % → $
//       console.log("% to $");
//       newPnl = (pnl / 100) * totalCost;
//     } else if (pnlType === "%") {
//       // convert $ → %
//       console.log("$ to %");
//       console.log(pnl, totalCost);
//       newPnl = (pnl / totalCost) * 100;
//     }

//     if (newPnl !== undefined && newPnl !== pnl) {
//       setFormData((prev) => ({
//         ...prev,
//         pnl: Number(((((pnl / totalCost) / 100) - 1) * 100).toFixed(2)),
//       }));
//     }
// }, [formData.pnlType]);

  // --- AUTO-ADJUST CHART INTERVAL ---
  const getChartInterval = () => {
    if (formData.type === "Options") {
      const dteNum = formData.dte ?? 0;
      if (dteNum === 0) return "1m";
      if (dteNum <= 2) return "5m";
      return "1d";
    }
    return formData.entryTime ? "1m" : "5m";
  };

  return (
    <main>
      <div className="px-4 bg-gray-100 max-w-7xl min-h-screen mx-auto space-y-6">
        {/* Trade Form */}
          <form onSubmit={handleSubmit} >
            <div className="flex flex-col md:flex-row gap-6 pl-4 mr-4">
            <div className="bg-white rounded-xl shadow-lg border p-4 w-full md:w-4/7 transition-all duration-300">
                <h2 className="flex justify-center text-xl font-bold text-gray-900 mb-3 border-b pb-2">Add Trade</h2>

                {/* Start of First Row */}
                <div
                  className={`grid gap-6
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-3 justify-items-center"} 
                  `}
                >
                  <div className="w-full">
                    <label className="block text-xs font-medium mb-2">
                      <span className="text-gray-700">Symbol </span>
                      <span className="text-orange-700">*</span>
                    </label>
                    <input
                      required
                      placeholder="Ticker"
                      value={formData.symbol}
                      onChange={e => handleSymbol(e.target.value.trim().toUpperCase())}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-medium mb-2">
                      <span className="text-gray-700">Type </span>
                      <span className="text-orange-700">*</span>
                    </label>

                    <Select<OptionType>
                      required
                      value={
                        formData.type
                          ? { value: formData.type, label: `${formData.type} Trade` }
                          : null
                      }
                      onChange={(opt: SingleValue<OptionType>) => {
                        if (opt) handleTypeChange(opt.value);
                      }}
                      options={[
                        { value: "Options", label: "Options Trade" },
                        { value: "Stock", label: "Stock Trade" },
                      ]}
                      className="text-gray-900 shadow-sm text-sm"
                      components={{
                        SingleValue: (props) => (
                          <components.SingleValue {...props}>
                            {props.data.value}
                          </components.SingleValue>
                        ),
                      }}
                    />
                  </div>
                  {/* Direction */}
                  {formData.type === "Options" &&  (
                    <div className="w-full">
                      <label className="block text-xs font-medium mb-2">
                        <span className="text-gray-700">Action </span>
                        <span className="text-orange-700">*</span>
                      </label>
                      <Select
                        required
                        value={formData.direction ? { value: formData.direction, label: formData.direction } : null}
                        onChange={(option) => setFormData({...formData, direction: option ? (option.value as DirectionType) : ""})}                       
                        options={[
                          { value: "Buy Call", label: "Buy Call"},
                          { value: "Buy Put", label: "Buy Put"},
                          // { value: "Sell Call", label: "Sell Call"},
                          // { value: "Sell Put", label: "Sell Put"},
                        ]}
                        placeholder = "Select..."
                        className="text-gray-900 shadow-sm text-sm"
                      />
                    </div>
                  )}

                  {formData.type === "Stock" &&  (
                    <div className="w-full">
                      <label className="block text-xs font-medium mb-2">
                        <span className="text-gray-700">Action </span>
                        <span className="text-orange-700">*</span>
                      </label>
                      <Select
                        required
                        value={formData.direction ? { value: formData.direction, label: formData.direction } : null}
                        onChange={(option) => setFormData({...formData, direction: option ? (option.value as DirectionType) : ""})}                       
                        options={[
                          { value: "Long", label: "Long"},
                          { value: "Short", label: "Short" },
                        ]}
                        placeholder = "Select..."
                        className="text-gray-900 shadow-sm text-sm"
                      />
                    </div>
                 ) }

                </div>
                {/* End Of First row: symbol, type, shares/contract, dte */}


                {/* Start of Second row*/}
                <div
                  className={`grid gap-4 mt-5
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-4 justify-items-center"}
                    `}
                  // className="grid gap-6 mt-5 grid-cols-1 md:grid-cols-4" 
                >
                  <div className="w-full">
                    <label className="block text-xs font-medium mb-2">
                      <span className = "text-gray-700">Entry Date </span>
                      <span className = "text-orange-700">*</span>
                    </label>                        
                    <DatePicker
                      required
                      selected={formData.entryDate}
                      onChange={(date: Date | null) =>
                        setFormData({ ...formData, entryDate: date })
                      }
                      isClearable
                      placeholderText="yyyy-MM-dd"
                      wrapperClassName="w-full"
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      dateFormat="yyyy-MM-dd"
                      filterDate={isTradingDay}   // ✅ disable weekends & holidays
                    />
                  </div>

                   <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Entry Time{" "}
                        {formData.type === "Stock" && (
                          <span className="text-orange-500">*</span>
                        )}
                    </label>                
                    <DatePicker
                      required = {formData.type === "Stock"}
                      selected={formData.entryTime}
                      onChange={(date: Date | null) => setFormData({ ...formData, entryTime: clampEntryTime(date!)})}
                      isClearable
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={1}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      placeholderText="hh:mm aa"
                      minTime={new Date(0, 0, 0, 9, 30)}   // 9:30 AM
                      maxTime={new Date(0, 0, 0, 15, 59)}  // 3:59 PM
                      wrapperClassName="w-full"    // <-- makes the wrapper span full width
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"                   
                    />
                  </div>

                   {/* Entry Field */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {entryFieldMap[formData.type].label}{" "}
                        <span className="text-orange-500">*</span>
                      </label>
                      <input
                          required
                          min={0}
                          type="number"
                          step="0.01"
                          value={
                            (formData[entryFieldMap[formData.type].key] as number | undefined) ?? ""
                          }
                          onChange={(e) => {
                            let val = e.target.value ? Number(e.target.value) : undefined;

                            // clamp to 0 if negative
                            if (val !== undefined && val < 0) val = 0;

                            if (entryFieldMap[formData.type].specialHandler) {
                              handleEntryPriceChange(val);
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                [entryFieldMap[formData.type].key]: val,
                              }));
                            }
                          }}
                          placeholder="00.00"
                          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>
                  )}
                  
                  {/* Quantity Entry Field */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {quantityEntryFieldMap[formData.type].label}{" "}
                        <span className="text-orange-500">*</span>
                      </label>
                      <input
                        required
                        min={0}
                        type="number"
                        step= {formData.type === "Stock" ? "0.01" : "1"}
                        value={formData[quantityEntryFieldMap[formData.type].key] as number | undefined ?? ""}
                        onChange={(e) => {
                          let val: number | undefined = e.target.value ? Number(e.target.value) : undefined;

                          // clamp to 0 if negative
                          if (val !== undefined && val < 0) val = 0;

                          if (quantityEntryFieldMap[formData.type].specialHandler) {
                            handleSharesChange(val);
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              [quantityEntryFieldMap[formData.type].key]: val != undefined ? Math.round(val) : undefined,
                            }));
                          }
                        }}
                        placeholder="00.00"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      />
                    </div>
                  )}
                </div> 

                {/* Start of Third row just for Options*/}
                {formData.type === "Options" && (
                  <div
                    className= "grid gap-6 mt-5 grid-cols-1 md:grid-cols-2 justify-items-center"
                  >
                    {/* DTE box only for Options
                    {formData.type === "Options" && (
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">DTE</label>
                        <input
                          type="number"
                          min={0}
                          value={formData.dte}
                          onChange={e => setFormData({ ...formData, dte: e.target.value })}
                          placeholder="Days to Exp."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                      </div>
                    )} */}

                    {/* {formData.type === "Options" &&  ( */}
                      <div className="w-full">
                        <label className="block text-xs font-medium mb-2">
                          <span className="text-gray-700">Exp. Date </span>
                          <span className="text-orange-700">*</span>
                        </label>
                      <DatePicker
                        required
                        selected={formData.contractExpDate}
                        onChange={(date: Date | null) => setFormData({ ...formData, contractExpDate: date })}
                        isClearable
                        placeholderText="yyyy-MM-dd"
                        wrapperClassName="w-full"    // <-- makes the wrapper span full width
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        dateFormat="yyyy-MM-dd"
                        filterDate={isTradingDay}   // ✅ disable weekends & holidays
                        minDate = {formData.entryDate ? formData.entryDate : undefined}
                      />
                    </div>
                    {/* )} */}

                    {/* {formData.type === "Options" && ( */}
                      <div className="w-full">
                        <label className="block text-xs font-medium mb-2">
                          <span className="text-gray-700">Strike Price </span>
                          <span className="text-orange-700">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          step="0.50"
                          min={0}
                          value={formData.strikePrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            handleStrikePriceChange(val);
                          }}
                          placeholder="00.00"
                          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                      </div>
                    {/* )} */}
                  </div>
                )}

                {/* Start of Fourth Row */}
                <div className={`flex justify-center mt-5 mb-2 ${formData.type == "Stock" ? "pt-9 pb-11" : ""}`}>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.stillActive}
                      onChange={e => handleStillActiveToggle(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    <span className="text-gray-700 text-sm">Trade is Still Open</span>
                  </label>
                </div>

                {/* Start of Fifth row */}
                <div className={`grid gap-4 mt-5
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-4 justify-items-center"}
                    `}
                >
                  <div className = "w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Exit Date{" "}
                        {formData.stillActive === false && (
                          <span className="text-orange-500">*</span>
                        )}
                    </label>     
                    <DatePicker
                      required = {formData.stillActive === false}
                      selected={formData.exitDate}
                      onChange={(date: Date | null) => setFormData({ ...formData, exitDate: date })}
                      isClearable
                      disabled={formData.stillActive}
                      placeholderText="yyyy-MM-dd"
                      wrapperClassName="w-full"    // <-- makes the wrapper span full width
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"                      
                      dateFormat="yyyy-MM-dd"
                      filterDate={isTradingDay}   // ✅ disable weekends & holidays
                      minDate={formData.entryDate || undefined}
                      maxDate = {(formData.type === "Options" && formData.contractExpDate) ? formData.contractExpDate : undefined}
                    />
                  </div>

                  <div className = "w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Exit Time{" "}
                        {(formData.type === "Stock" && formData.stillActive === false) && (
                          <span className="text-orange-500">*</span>
                        )}
                    </label>    
                    <DatePicker
                      required = {(formData.type === "Stock" && formData.stillActive === false)}
                      selected={formData.exitTime}
                      onChange={(date: Date | null) => setFormData({ ...formData, exitTime: date })}
                      isClearable
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={1}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      disabled={formData.stillActive}
                      minTime={
                        formData.exitDate &&
                        formData.entryDate &&
                        formData.exitDate.toDateString() === formData.entryDate.toDateString()
                          ? formData.entryTime || new Date(0, 0, 0, 9, 30) // fallback if entryTime missing
                          : new Date(0, 0, 0, 9, 30)
                      } 
                      maxTime={new Date(0, 0, 0, 15, 59)}  // 3:59 PM
                      placeholderText="hh:mm aa"
                      wrapperClassName="w-full"    // <-- makes the wrapper span full width
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"                      
                    />                   
                  </div>

                  {/* Exit Price / Exit Premium */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {exitFieldMap[formData.type].label}{" "}
                        {formData.stillActive === false && (
                          <span className="text-orange-500">*</span>
                        )}
                      </label>
                      <input
                        required={formData.stillActive === false}
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData[exitFieldMap[formData.type].key] as number | undefined ?? ""}
                        onChange={(e) => {
                            let val = e.target.value ? Number(e.target.value) : undefined;

                            // clamp to 0 if negative
                            if (val !== undefined && val < 0) val = 0;

                            if (exitFieldMap[formData.type].specialHandler) {
                              console.log("ExitPriceHandleWasCalled");
                              handleExitPriceChange(val);
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                [exitFieldMap[formData.type].key]: val,
                              }));
                            }
                          }}
                        placeholder="00.00"
                        disabled={formData.stillActive}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  )}

                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {quantityExitFieldMap[formData.type].label}{" "}
                        {formData.stillActive === false && (
                          <span className="text-orange-500">*</span>
                        )}
                      </label>
                      <input
                        required={formData.stillActive === false}
                        type="number"
                        step="0.01"
                        min={0}
                        max={
                          formData.type === "Stock"
                            ? formData.shares ?? undefined
                            : formData.contracts ?? undefined
                        }
                        value={formData[quantityExitFieldMap[formData.type].key] as number | undefined ?? ""}
                        onChange={(e) => {
                          let val: number | undefined = e.target.value ? Number(e.target.value) : undefined;

                          if (val !== undefined) {
                            // Determine max value based on type
                            const maxVal =
                              formData.type === "Stock"
                                ? formData.shares
                                : formData.contracts;

                            if (maxVal !== undefined) {
                              // Clamp val between 0 and maxVal
                              val = Math.max(0, Math.min(val, maxVal));
                            } else {
                              // Only clamp to 0 if maxVal is undefined
                              val = Math.max(0, val);
                            }
                          }

                          setFormData({
                            ...formData,
                            [quantityExitFieldMap[formData.type].key]: val,
                          });
                        }}
                        placeholder={`00.00`}
                        disabled={formData.stillActive}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  )}
                </div>

                
                {/* Fourth row: stop loss, pnl*/}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className = "w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Total Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalCost ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        handleTotalCostChange(val);
                      }}
                      placeholder="00.00"
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Stop Loss</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stopLoss ?? ""}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setFormData({ ...formData, stopLoss: val });
                        }}                        
                        placeholder="00.00"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      />
                      <select
                        value={formData.stopLossType}
                        onChange={e => setFormData({ ...formData, stopLossType: e.target.value as StopLossType })}
                        className="px-2 text-xs border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div> 
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Profit/Loss</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pnl ?? ""}
                         onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setFormData({ ...formData, pnl: val });
                        }} 
                        disabled={formData.stillActive}
                        placeholder="00.00"
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                      <select
                        value={formData.pnlType}
                        onChange={e => setFormData({ ...formData, pnlType: e.target.value as PnLType })}
                        className="px-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div> 
                  </div>
                </div>
              </div>
              {/* Chart */}
            <div className="bg-white rounded-xl shadow-lg border p-4 w-full md:w-3/6 transition-all duration-300">
                {formData.symbol && formData.type ? (
                    <Chart
                      key={`${getTicker(formData.symbol)}-${entryUnix}-${exitUnix}`}
                      ticker={getTicker(formData.symbol)}
                      interval={getChartInterval()}
                      entry={entryUnix as unknown as Time}
                      exit={exitUnix as unknown as Time}
                      height={390}
                      width={600}
                      page="diary"
                    />
                ) : (
                    <div className = "w-full flex justify-center items-center">
                        <ChartLine className="w-110 h-110 text-gray-300 animate-pulse" />
                    </div>
                )}
                </div>
            </div>
              
            {/* Notes */}
            <div className = "bg-white m-8 pr-4 pl-4 pt-2 pb-4 shadow-md rounded-lg">
              {/* Setups Section */}
              {/* Start of setups section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setup Utilized
                </label>

                <Select
                value={
                  selectedSetupId
                    ? setups
                        .map(s => ({ value: s.id, label: s.name, rules: s.rules }))
                        .find(opt => opt.value === selectedSetupId)
                    : { value: null, label: 'Select a Setup', rules: [] } // default option
                }
                onChange={(opt: SetupOption | null) => {
                  if (!opt || opt.value === null) {
                    // reset all
                    setSelectedSetupId(null);
                    setSelectedRules([]);
                    setFormData(prev => ({
                      ...prev,
                      setup: "",
                      setupRules: [],
                    }));
                  } else {
                    setSelectedSetupId(opt.value);
                    setSelectedRules(opt.rules.map(() => false) || []);
                    setFormData(prev => ({
                      ...prev,
                      setup: opt.label,
                      setupRules: [],
                    }));
                  }
                }}
                options={[
                  { value: null, label: 'Select a Setup', rules: [] }, // default reset option
                  ...setups.map(s => ({ value: s.id, label: s.name, rules: s.rules }))
                ]}
                placeholder="Select a setup"
                noOptionsMessage={() => "No setups"}
                className="w-full text-gray-900 z-35"
                classNames={{
                  control: () =>
                    'border border-gray-300 rounded-md shadow-sm hover:border-indigo-500 focus-within:border-indigo-500 transition-colors',
                  menu: () => 'rounded-md shadow-lg', // ensure menu appears on top
                  option: ({ isFocused, isSelected }) =>
                    `cursor-pointer px-3 py-2 ${isFocused ? 'bg-indigo-50' : ''} ${
                      isSelected ? 'bg-indigo-100 font-semibold' : ''
                    }`,
                }}
              />


                {selectedSetupId && selectedRules.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {setups.find(s => s.id === selectedSetupId)?.rules.map((rule, idx) => (
                      <label
                        key={idx}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRules[idx]}
                          onChange={() => {
                            const newSelectedRules = [...selectedRules];
                            newSelectedRules[idx] = !newSelectedRules[idx];
                            setSelectedRules(newSelectedRules);

                            const selectedRuleNames =
                              setups
                                .find(s => s.id === selectedSetupId)
                                ?.rules.filter((_, i) => newSelectedRules[i]) || [];
                            setFormData(prev => ({
                              ...prev,
                              setupRules: selectedRuleNames,
                            }));
                          }}
                          className="accent-indigo-500 w-5 h-5"
                        />
                        <span className="text-gray-700 mx-auto">{rule}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-t border-gray-300 mt-4" />

              <div className="mt-4">
                <RichTextEditor
                  value={formData.notes}
                  onChange={(newVal) => setFormData({ ...formData, notes: newVal })}
                />
              </div>
              <div className="flex justify-center mt-4">
                <button
                  // onClick = {handleSubmit}
                  type="submit"
                  className="w-full md:w-1/3 px-5 py-3 mt-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  {trade ? "Update Trade" : "Submit Trade"}
                </button>
              </div>
          </div>
        </form>
    </div>
</main>
  )
}