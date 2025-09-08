'use client';

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Select, { components, SingleValue } from "react-select";
import Chart from '@/components/ChartClient/Chart';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Time } from "lightweight-charts";
import Holidays from "date-holidays";
import { getTicker } from '@/components/ChartClient/Chart'
import { supabase } from '@/lib/supabaseFrontendClient';

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

const hd = new Holidays("US");
const holidayCache: Record<number, Set<string>> = {};

interface TradeFormData {
  _id: number;
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
  outcome: OutcomeType;
}

interface Setup {
  id: string;
  name: string;
  rules: string[];
}

export default function TradeDiaryPage() {
  const searchParams = useSearchParams();
  const createParam = searchParams.get('add');
  const tickerParam = searchParams.get('ticker');

  // if add trade is called from watchlist
  useEffect(() => {
    if (createParam === 'true') setIsAdding(true);
    // for guests
    // const stored = localStorage.getItem('setups');
    // if (stored) setSetups(JSON.parse(stored));
  }, [createParam]);

  // initial "Add Trade" form
  const initialForm: TradeFormData = {
    _id: 0,
    symbol: "",
    type: "",
    direction: "",
    contractExpDate: null,
    strikePrice: undefined,
    dte: undefined,
    entryDate: clampEntryDate(new Date()),
    entryTime: null,
    entryPrice: undefined,
    entryPremium: undefined,
    shares: undefined,
    contracts: undefined,
    stillActive: false,
    exitDate: null,
    exitTime: null,
    exitPrice: undefined,
    exitPremium: undefined,
    sharesSold: undefined,
    contractsSold: undefined,
    totalCost: undefined,
    stopLoss: undefined,
    stopLossType: "%",
    pnl: undefined,
    pnlType: "$",
    setup: "",
    setupRules: [],
    notes: "",
    outcome: "",
  };

  // vars
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<TradeFormData>(initialForm);
  const [trades, setTrades] = useState<TradeFormData[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<boolean[]>([]);
  const [typicalEntryPrice, setTypicalEntryPrice] = useState<number | null>(null);
  const [typicalExitPrice, setTypicalExitPrice] = useState<number | null>(null);
  const [totalCostEdited, setTotalCostEdited] = useState(false);
  const [entryPriceEdited, setEntryPriceEdited] = useState(false);
  const [exitPriceEdited, setExitPriceEdited] = useState(false);
  const [strikePriceEdited, setStrikePriceEdited] = useState(false);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    if (!tickerParam) return;
    
    console.log("here");
    setSymbol(tickerParam)
    formData.symbol = tickerParam;
    
  }, [formData, tickerParam]);

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

  // whenever selectedSetupId changes, reset the rule checkboxes
  useEffect(() => {
    if (selectedSetupId) {
      const setup = setups.find((s) => s.id === selectedSetupId);
      if (setup) {
        setSelectedRules(setup.rules.map(() => false));
      }
    }
  }, [selectedSetupId, setups]);

  // handle const functions
  const handleSymbol = (symbol : string) => {
    setSymbol(symbol);
    formData.symbol = symbol;
  }

  // --- LOCK ENTRY PRICE WHEN USER EDITS ---
  const handleEntryPriceChange = (value: number | undefined) => {
    setEntryPriceEdited(value !== undefined && value !== 0 && value != typicalEntryPrice); // optional: consider 0 as not edited
    setFormData(prev => ({
      ...prev,
      entryPrice: value,
    }));
  };


  const handleExitPriceChange = (value: number | undefined) => {
    setExitPriceEdited(value !== undefined && value !== 0 && value != typicalExitPrice);
    setFormData(prev => ({
      ...prev,
      exitPrice: value,
    }));
  };

  // --- LOCK STRIKE PRICE WHEN USER EDITS ---
  const handleStrikePriceChange = (value: number | undefined) => {
    setStrikePriceEdited(value !== undefined); // true if a number was entered
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
    setTotalCostEdited(value !== undefined && value !== 0);
    setFormData(prev => ({
      ...prev,
      totalCost: value,
    }));
  };


  // --- HANDLE SUBMISSION ---
  const handleSubmit = (e: React.FormEvent) => {
    // FIX THIS
    e.preventDefault();
    if (!formData.symbol || 
        (!formData.shares && formData.type === "Stock") || 
        (!formData.contracts && formData.type === "Options") || 
        !formData.totalCost ||
        !formData.entryDate || 
        !formData.entryTime ){
      toast.error("Please fill in all required fields ( * )");
      return;
    }

    const newTrade: TradeFormData = { ...formData, _id: Date.now() };
    
    setTrades([newTrade, ...trades]);
    setFormData(initialForm);
    setSelectedSetupId(null);
    setSetups([])
    setSelectedRules([]);
    setIsAdding(false);
    setTypicalEntryPrice(null);
    setTypicalExitPrice(null);
    setTotalCostEdited(false);

    toast.success("Trade added to diary");
  };

  // --- HANDLE TRADE DIARY CANCELLATION ---
  const handleCancel = () => {
    setFormData(initialForm);
    setSelectedSetupId(null);
    setSetups([])
    setSelectedRules([]);
    setIsAdding(false);
    setTypicalEntryPrice(null);
    setTypicalExitPrice(null);
    setTotalCostEdited(false);
    setEntryPriceEdited(false);
    setExitPriceEdited(false);
  }

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
      // entryDate: new Date(),
      // entryTime: null,
      stillActive: false,
      // exitDate: null,
      // exitTime: null,
      sharesSold: undefined,
      contractsSold: undefined,
      stopLoss: undefined,
      stopLossType: "%",
      pnl: undefined,
      pnlType: "$",
      setup: "",
      setupRules: [],
      notes: "",
      outcome: "",
    });
    setTotalCostEdited(false);
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
  
  function formatDateLocal(date: Date): string {
    return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  }

  function getHolidaySet(year: number) {
    const holidays = hd.getHolidays(year);
    return new Set(holidays.map(h => formatDateLocal(new Date(h.date))));
  }
  
  function isTradingDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;

    const year = date.getFullYear();
    if (!holidayCache[year]) holidayCache[year] = getHolidaySet(year);

    const key = formatDateLocal(date);
    return !holidayCache[year].has(key);
  }
  
  function getPreviousTradingDay(date: Date = new Date()): string {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    while (!isTradingDay(d)) d.setDate(d.getDate() - 1);
    return formatDateLocal(d); // use local YYYY-MM-DD
  }
  
  function clampEntryDate(date: Date | null | undefined): Date | null {
    if (!date) return null;
    return new Date(getPreviousTradingDay(date) + "T00:00:00"); 
    // ensures midnight local
  }

  /**
   * Calculate DTE (trading days) between entryDate and contractExpDate
   * @param entryDate Date object of entry
   * @param contractExpDate Date object of option expiration
   * @returns number of trading days (DTE)
   */
  function calculateDTE(entryDate: Date, expirationDate: Date): number {
    let dte = 0;
    const current = new Date(entryDate);

    while (current < expirationDate) {
      if (isTradingDay(current)) {
        dte++;
      }
      current.setDate(current.getDate() + 1);
    }

    return dte;
  }

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

  // ✅ FETCH TYPICAL ENTRY PRICE BASED ON SYMBOL AND FULL ENTRY DATE & TIME DATA
  useEffect(() => {
    if (!formData.symbol || !formData.entryDate || !formData.entryTime) return;

    const handler = setTimeout(async () => {
      try {
        const url = new URL('/api/bar', window.location.origin);
        url.searchParams.append('symbol', formData.symbol);
        if (entryUnix !== undefined) {
          url.searchParams.append('timestamp', entryUnix.toString());
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch bar data");

        const data = await res.json();
        const price = (data.high + data.low + data.close) / 3;
        setTypicalEntryPrice(Number(price.toFixed(3)));


      } catch (err) {
        console.warn("Skipping fetch until valid symbol:", err);
        setTypicalEntryPrice(null); // ⚡ don’t use fallback here
      }
    }, 500); // wait 500ms after last keystroke

    return () => clearTimeout(handler); // cancel previous timeout on symbol change
  }, [formData.symbol, formData.entryDate, formData.entryTime, entryUnix]);

  // ✅ FETCH TYPICAL Exit PRICE BASED ON SYMBOL AND FULL EXIT DATE & TIME DATA
  useEffect(() => {
    if (!formData.symbol || formData.type != "Stock" || !formData.exitDate || !formData.exitTime) return;

    const handler = setTimeout(async () => {
      try {
        const url = new URL('/api/bar', window.location.origin);
        url.searchParams.append('symbol', formData.symbol);
        if (exitUnix !== undefined) {
          url.searchParams.append('timestamp', exitUnix.toString());
        }

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch bar data");

        const data = await res.json();
        const price = (data.high + data.low + data.close) / 3;
        setTypicalExitPrice(Number(price.toFixed(3)));

      } catch (err) {
        console.warn("Skipping fetch until valid symbol:", err);
        setTypicalExitPrice(null); // ⚡ don’t use fallback here
      }
    }, 500); // wait 500ms after last keystroke

    return () => clearTimeout(handler); // cancel previous timeout on symbol change
  }, [formData.symbol, formData.exitDate, formData.exitTime, exitUnix, formData.type]);
  
  // --- STOCK ENTRY PRICE and STRIKE PRICE AUTO-FILL ---
  useEffect(() => {
    if (!typicalEntryPrice || !formData.type) return;

    // Only set entryPrice automatically if user hasn't manually edited it
    if (formData.type === "Stock") {
      if (!entryPriceEdited) {
        setFormData(prev => ({
          ...prev,
          entryPrice: typicalEntryPrice,
        }));
      }
    } 

    if (formData.type === "Options") {
      if (!strikePriceEdited) {
        setFormData(prev => ({
          ...prev,
          strikePrice: (Math.round(typicalEntryPrice)),
        }));
      }
    }
  }, [typicalEntryPrice, formData.type, formData.entryDate, formData.entryTime, entryPriceEdited, strikePriceEdited]);

  // --- STOCK EXIT PRICE AUTO-FILL ---
  useEffect(() => {
    if (!typicalExitPrice || !formData.exitDate || !formData.exitTime || formData.type !== "Stock" || formData.stillActive) return;

    if (!exitPriceEdited) {
      setFormData(prev => ({
        ...prev,
        exitPrice: typicalExitPrice,
      }));
    }
    
  }, [formData.stillActive, typicalExitPrice, formData.type, formData.exitDate, formData.exitTime, exitPriceEdited]);

  // --- TOTAL COST AUTO-CALCULATION ---
  useEffect(() => {
    if (!formData.type) return;

    if (formData.type === "Stock") {

      // Only auto-calc totalCost if user hasn't manually edited it
      if (!totalCostEdited) {
        if (!formData.entryPrice || !formData.shares) {
          setFormData(prev => ({ ...prev, totalCost: undefined }));
          return;
        }
        const entry = formData.entryPrice;
        const shares = formData.shares;

        setFormData(prev => ({
          ...prev,
          totalCost: Number((entry * shares).toFixed(3)),
        }));
      }
    }

    if (formData.type === "Options") {
      // Only auto-calc totalCost if user hasn't manually edited it
      if (!totalCostEdited) {
        if (!formData.entryPremium|| !formData.contracts) {
          setFormData(prev => ({ ...prev, totalCost: undefined }));
          return;
        }
        const premium = formData.entryPremium;
        const contracts = formData.contracts;
        const total = (contracts * premium * 100);

        setFormData(prev => ({
          ...prev,
          totalCost: total
        }));
      }

    }
  }, [formData.entryPrice, formData.entryPremium, formData.shares, formData.contracts, formData.type, totalCostEdited]);

  // update DTE given entryDate and contractExpDate
  useEffect(() => {
    if (formData.type !== "Options" || !formData.entryDate || !formData.contractExpDate) return;

    setFormData({
      ...formData, 
      dte: calculateDTE(formData.entryDate, formData.contractExpDate)
    })
  }, [formData.entryDate, formData.contractExpDate, calculateDTE, formData])


  useEffect(() => {
    if (!formData.type ||
      (formData.type === "Stock" && !formData.sharesSold) ||
      (formData.type === "Options" && !formData.contractsSold)) return;

    if (formData.type === "Stock" && formData.shares) {
      const shares = formData.shares;
      const sharesSold = formData.sharesSold ?? 0;
      setFormData({
        ...formData, 
        sharesSold: (sharesSold > shares ? shares : sharesSold)
      })
    }

    if (formData.type === "Options" && formData.contracts) {
      const contracts = formData.contracts;
      const contractsSold = formData.contractsSold ?? 0;
      setFormData({
        ...formData, 
        contractsSold: (contractsSold > contracts ? contracts : contractsSold)
      })
    }
  }, [formData.shares, formData.contracts, formData])

  // AUTO PNL CALCULATION
  useEffect(() => {
    // If trade is still active, skip calculation
    if (formData.pnl && formData.stillActive) {
      setFormData(prev => ({
        ...prev,
        pnl: undefined,
      }));
      return;
    }

    let pnl: number | undefined;

    if (formData.totalCost !== undefined) {
      if (formData.type === "Stock") {
        const { exitPrice, sharesSold } = formData;

        if (exitPrice !== undefined && sharesSold !== undefined) {
          pnl = Number(((exitPrice * sharesSold) - formData.totalCost).toFixed(3));
        } else {
          pnl = undefined; // one of the values missing → no PnL
        }

      } else if (formData.type === "Options") {
        const { exitPremium, contractsSold } = formData;

        if (exitPremium !== undefined && contractsSold !== undefined) {
          pnl = Number(((exitPremium * contractsSold) - formData.totalCost).toFixed(3));
        } else {
          pnl = undefined; // one of the values missing → no PnL
        }
      }

      setFormData(prev => ({
        ...prev,
        pnl,
      }));
    }
    
   }, [formData.stillActive, formData.totalCost, formData.exitPrice, formData.sharesSold, formData.exitPremium, formData.contractsSold, formData])

  // AUTO PNL TYPE CALCULATION change % to $ vice versa
  useEffect(() => {
    if (!formData.pnl) return;

    

  }, [formData.pnlType, formData.pnl])

  // --- AUTO-ADJUST CHART INTERVAL ---
  const getChartInterval = () => {
    if (formData.type === "Options") {
      const dteNum = formData.dte ?? 0;
      if (dteNum === 0) return "1m";
      if (dteNum <= 2) return "5m";
      return "1d";
    }
    return "5m";
  };

  const stats = (() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl ? Number(t.pnl) : 0), 0);
    return { totalTrades, wins, losses, winRate, totalPnL };
  })();

  return (
    <main>
      <PageHeader title="Trade Diary"/>
      <div className="p-4 bg-gray-100 max-w-7xl min-h-screen mx-auto space-y-6">
        {/* Stats */}
        {!isAdding &&
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {([
              ["Total Trades", stats.totalTrades, "text-blue-600"],
              ["Wins", stats.wins, "text-green-600"],
              ["Losses", stats.losses, "text-red-600"],
              ["Win Rate", `${stats.winRate.toFixed(1)}%`, "text-purple-600"],
              ["Total P&L", `$${stats.totalPnL.toFixed(2)}`, stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"],
            ] as const).map(([label, value, color]) => (
              <div key={label} className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm font-medium text-gray-500">{label}</h3>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        }

        {/* Add Trade Button */}
        <div className="flex justify-end">
          <button
           onClick={() => { 
            if (isAdding) handleCancel(); // ✅ actually calls the function
            setIsAdding(!isAdding);
          }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isAdding ? "Cancel" : "Add Trade"}
          </button>
        </div>

        {/* Trade Form */}
        {isAdding && (
          <div>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 pl-8 mr-8">
              <div className="bg-white rounded-xl shadow-lg border p-4 flex-2 transition-all duration-300 w-full">
                <h2 className="flex justify-center text-2xl font-bold text-gray-900 mb-3 border-b pb-2">Add Trade</h2>

                {/* Start of First Row */}
                <div
                  className={`grid gap-6
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-3 justify-items-center"} 
                  `}
                >
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
                      <span className="text-gray-700">Symbol </span>
                      <span className="text-orange-700">*</span>
                    </label>
                    <input
                      required
                      placeholder="Ticker"
                      value={symbol}
                      onChange={e => handleSymbol(e.target.value.trim().toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
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
                      className="text-gray-900 shadow-sm"
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
                      <label className="block text-sm font-medium mb-2">
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
                          { value: "Sell Call", label: "Sell Call"},
                          { value: "Sell Put", label: "Sell Put"},
                        ]}
                        placeholder = "Select..."
                        className="text-gray-900 shadow-sm"
                      />
                    </div>
                  )}

                  {formData.type === "Stock" &&  (
                    <div className="w-full">
                      <label className="block text-sm font-medium mb-2">
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
                        className="text-gray-900 shadow-sm"
                      />
                    </div>
                 ) }

                </div>
                {/* End Of First row: symbol, type, shares/contract, dte */}


                {/* Start of Second row*/}
                <div
                  className={`grid gap-6 mt-5
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-4 justify-items-center"}
                    `}
                  // className="grid gap-6 mt-5 grid-cols-1 md:grid-cols-4" 
                >
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      dateFormat="yyyy-MM-dd"
                      filterDate={isTradingDay}   // ✅ disable weekends & holidays
                    />
                  </div>

                   <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"                   
                    />
                  </div>

                   {/* Entry Field */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>
                  )}
                  
                  {/* Quantity Entry Field */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              [quantityEntryFieldMap[formData.type].key]: val != undefined ? Math.round(val) : 0,
                            }));
                          }
                        }}
                        placeholder="00.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
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
                        <label className="block text-sm font-medium mb-2">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        dateFormat="yyyy-MM-dd"
                        filterDate={isTradingDay}   // ✅ disable weekends & holidays
                        minDate = {formData.entryDate ? formData.entryDate : undefined}
                      />
                    </div>
                    {/* )} */}

                    {/* {formData.type === "Options" && ( */}
                      <div className="w-full">
                        <label className="block text-sm font-medium mb-2">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                      </div>
                    {/* )} */}
                  </div>
                )}

                {/* Start of Fourth Row */}
                <div className="flex justify-center mt-5 mb-2">
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
                <div className={`grid gap-6 mt-5
                    ${!formData.type 
                      ? "grid-cols-1 md:grid-cols-2 justify-items-center" // symbol + type
                      : "grid-cols-1 md:grid-cols-4 justify-items-center"}
                    `}
                >
                  <div className = "w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"                      
                      dateFormat="yyyy-MM-dd"
                      filterDate={isTradingDay}   // ✅ disable weekends & holidays
                      minDate={formData.entryDate || undefined}
                      maxDate = {(formData.type === "Options" && formData.contractExpDate) ? formData.contractExpDate : undefined}
                    />
                  </div>

                  <div className = "w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"                      
                    />                   
                  </div>

                  {/* Exit Price / Exit Premium */}
                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  )}

                  {formData.type && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        placeholder={`# of ${formData.type === "Stock" ? "Shares" : "Contracts"}`}
                        disabled={formData.stillActive}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                  )}
                </div>

                
                {/* Fourth row: stop loss, pnl*/}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <div className = "w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalCost ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        handleTotalCostChange(val);
                      }}
                      placeholder="00.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stopLoss ?? ""}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setFormData({ ...formData, stopLoss: val });
                        }}                        
                        placeholder="Stop Loss"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      />
                      <select
                        value={formData.stopLossType}
                        onChange={e => setFormData({ ...formData, stopLossType: e.target.value as StopLossType })}
                        className="px-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div> 
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profit/Loss</label>
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
                        placeholder="pnl"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 disabled:bg-gray-100"
                      />
                      <select
                        value={formData.pnlType}
                        onChange={e => setFormData({ ...formData, pnlType: e.target.value as PnLType })}
                        className="px-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div> 
                  </div>
                </div>
              </div>
              {/* Chart */}
               {formData.symbol && formData.type && (
                  <div className="flex-2 sm:w-full lg:max-w-[400px]">
                    <Chart
                      ticker={getTicker(formData.symbol)}
                      interval={getChartInterval()}
                      entry={entryUnix as unknown as Time}
                      exit={exitUnix as unknown as Time}
                      height={450}
                      width={600}
                      page = {"diary"}
                    />
                  </div>
                )}
            </form>
              
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
                className="w-full text-gray-900 z-50"
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
                  onClick = {handleSubmit}
                  type="submit"
                  className="w-full md:w-1/3 px-5 py-3 mt-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  Submit Trade
                </button>
              </div>
          </div>
        </div>
      )}

        {/* Trades Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {!trades.length ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>No trades recorded yet</p>
              <p className="text-sm">Start tracking your trades to analyze performance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Entry",
                      "Exit",
                      "Symbol",
                      "Type",
                      "Shares/Contracts",
                      "Total Cost",
                      "Stop Loss",
                      "DTE",
                      "Setup",
                      "Outcome",
                      "P&L"
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {t.entryDate ? new Date(t.entryDate).toLocaleDateString() : "-"}{" "}
                        {t.entryTime ? new Date(t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {t.stillActive ? "Still Active" :
                          `${t.exitDate ? new Date(t.exitDate).toLocaleDateString() : "-"} ${t.exitTime ? new Date(t.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}`}
                      </td>
                      <td className="px-4 py-2 font-semibold">{t.symbol}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.type === 'Options' ? 'bg-orange-100 text-black-800' : 'bg-blue-100 text-black-800'}`}>
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2">{t.type === "Options" ? t.contracts || "-" : t.shares || "-"}</td>
                      <td className="px-4 py-2">${t.totalCost ?? 0}</td>
                      <td className="px-4 py-2">{t.stopLoss}{t.stopLossType}</td>
                      <td className="px-4 py-2">{t.type === 'Options' ? t.dte || '—' : '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{t.setup || "—"}</td>
                      <td className="px-4 py-2">
                        {t.outcome && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            t.outcome === 'win' ? 'bg-green-100 text-green-800' :
                            t.outcome === 'loss' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {t.outcome.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={t.pnl ?? 0 >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${t.pnl ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}


// lovable implementation

// 'use client'
// import { useState } from "react";
// import { 
//   Card, CardContent, CardHeader, CardTitle 
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { 
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { 
//   Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
// } from "@/components/ui/dialog";
// import { CalendarIcon, PlusIcon, FilterIcon } from "lucide-react";

// // Mock data
// const trades = [
//   {
//     id: 1,
//     date: "2024-12-01",
//     symbol: "AAPL",
//     type: "Call",
//     strike: "175",
//     expiry: "Dec 15, 2024",
//     quantity: 5,
//     entry: "$3.45",
//     exit: "$4.20",
//     pnl: "+$375.00",
//     status: "closed",
//     notes: "Bullish momentum after earnings beat. Sold at resistance level."
//   },
//   {
//     id: 2,
//     date: "2024-11-28",
//     symbol: "TSLA",
//     type: "Put",
//     strike: "250",
//     expiry: "Jan 19, 2025",
//     quantity: 3,
//     entry: "$8.90",
//     exit: "$6.50",
//     pnl: "-$720.00",
//     status: "closed",
//     notes: "Misjudged support level. Cut losses early as planned."
//   },
//   {
//     id: 3,
//     date: "2024-11-30",
//     symbol: "NVDA",
//     type: "Call",
//     strike: "450",
//     expiry: "Dec 29, 2024",
//     quantity: 2,
//     entry: "$12.30",
//     exit: "—",
//     pnl: "—",
//     status: "open",
//     notes: "AI sector showing strength. Watching for breakout above $460."
//   }
// ];

// export default function TradingDiary() {
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);

//   const filteredTrades = trades.filter(trade => 
//     filterStatus === "all" || trade.status === filterStatus
//   );

//   return (
//     <div className="space-y-8 px-6 py-8 max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-4xl font-bold tracking-tight text-foreground">Trading Diary</h1>
//           <p className="text-muted-foreground mt-2 text-base">
//             Track and analyze your trading performance
//           </p>
//         </div>
        
//         <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
//           <DialogTrigger asChild>
//             <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-md">
//               <PlusIcon className="mr-2 h-5 w-5" />
//               Add Trade
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-md">
//             <DialogHeader>
//               <DialogTitle className="text-xl font-semibold">Add New Trade</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-5">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="symbol">Symbol</Label>
//                   <Input id="symbol" placeholder="AAPL" />
//                 </div>
//                 <div>
//                   <Label htmlFor="type">Type</Label>
//                   <Select>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="call">Call</SelectItem>
//                       <SelectItem value="put">Put</SelectItem>
//                       <SelectItem value="shares">Shares</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="strike">Strike Price</Label>
//                   <Input id="strike" placeholder="175.00" />
//                 </div>
//                 <div>
//                   <Label htmlFor="quantity">Quantity</Label>
//                   <Input id="quantity" type="number" placeholder="5" />
//                 </div>
//               </div>
              
//               <div>
//                 <Label htmlFor="entry">Entry Price</Label>
//                 <Input id="entry" placeholder="3.45" />
//               </div>
              
//               <div>
//                 <Label htmlFor="notes">Notes</Label>
//                 <Textarea id="notes" placeholder="Trade rationale and strategy..." />
//               </div>
              
//               <Button className="w-full" disabled>
//                 Add Trade (Connect to Supabase)
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Filters */}
//       <Card className="bg-card/70 border shadow-sm">
//         <CardContent className="p-4">
//           <div className="flex items-center space-x-4">
//             <FilterIcon className="h-5 w-5 text-muted-foreground" />
//             <Select value={filterStatus} onValueChange={setFilterStatus}>
//               <SelectTrigger className="w-56">
//                 <SelectValue placeholder="Filter by status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Trades</SelectItem>
//                 <SelectItem value="open">Open Positions</SelectItem>
//                 <SelectItem value="closed">Closed Positions</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Trades List */}
//       <div className="space-y-6">
//         {filteredTrades.map((trade) => (
//           <Card 
//             key={trade.id} 
//             className="bg-gradient-to-br from-card via-card/90 to-muted/40 border border-border hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
//           >
//             <CardContent className="p-6">
//               <div className="flex items-start justify-between">
//                 <div className="space-y-4">
//                   <div className="flex items-center space-x-3">
//                     <h3 className="text-2xl font-semibold text-foreground">{trade.symbol}</h3>
//                     <Badge variant="outline" className="text-xs px-2 py-0.5">
//                       {trade.type}
//                     </Badge>
//                     <Badge 
//                       variant={trade.status === 'open' ? 'default' : 'secondary'}
//                       className="text-xs capitalize px-2 py-0.5"
//                     >
//                       {trade.status}
//                     </Badge>
//                   </div>
                  
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
//                     <div>
//                       <p className="text-muted-foreground">Strike</p>
//                       <p className="font-medium text-foreground">${trade.strike}</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">Quantity</p>
//                       <p className="font-medium text-foreground">{trade.quantity}</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">Entry</p>
//                       <p className="font-medium text-foreground">{trade.entry}</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">Exit</p>
//                       <p className="font-medium text-foreground">{trade.exit}</p>
//                     </div>
//                   </div>
                  
//                   <div className="text-sm space-y-1">
//                     <p className="text-muted-foreground">Expiry: {trade.expiry}</p>
//                     <p className="text-muted-foreground">Date: {trade.date}</p>
//                   </div>
                  
//                   {trade.notes && (
//                     <div className="bg-muted/40 border border-border/50 p-4 rounded-lg">
//                       <p className="text-sm text-muted-foreground mb-1 font-medium">Notes</p>
//                       <p className="text-sm text-foreground">{trade.notes}</p>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="text-right">
//                   <div className={`text-2xl font-bold ${
//                     trade.pnl === '—' 
//                       ? 'text-muted-foreground' 
//                       : trade.pnl.startsWith('+') 
//                         ? 'text-green-600' 
//                         : 'text-red-600'
//                   }`}>
//                     {trade.pnl}
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Empty State */}
//       {filteredTrades.length === 0 && (
//         <Card className="bg-card/40 border-dashed border-2">
//           <CardContent className="p-12 text-center">
//             <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-6" />
//             <h3 className="text-lg font-semibold text-foreground mb-2">No trades found</h3>
//             <p className="text-muted-foreground mb-6">
//               {filterStatus === 'all' ? 'Start by adding your first trade' : `No ${filterStatus} trades found`}
//             </p>
//             <Button variant="default" onClick={() => setIsAddTradeOpen(true)}>
//               Add Your First Trade
//             </Button>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
