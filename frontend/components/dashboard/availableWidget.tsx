"use client";

import React from "react";
import { TradeInsert } from "@/components/DiaryClient/TradeForm";
import DailyPnlChart from "@/components/dashboard/Widgets/DailyPnLChart";
import { PnlCalendar } from "@/components/dashboard/Widgets/PnLCalender";
import WatchlistTable from "@/components/dashboard/Widgets/WatchlistTable";
import QuickActionsWidget from "@/components/dashboard/Widgets/QuickActions";
import EarningsTable from "@/components/dashboard/Widgets/EarningsTable";
import { StatsWidget } from "@/components/dashboard/StatsWidget";

export interface AvailableWidget {
  id: string;
  title: string;
  description: string;
  category: string;
  span: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  component?: (props?: { editing?: boolean; trades?: TradeInsert[] }) => React.ReactNode;
}

export const AVAILABLE_WIDGETS: AvailableWidget[] = [
  // Analytics (stats widgets)
  {
    id: "net-pnl",
    title: "Net P&L",
    description: "Net profit & loss",
    category: "Analytics",
    span: 1,
    rowSpan: 1,
    component: (props) => <StatsWidget widgetId="net-pnl" trades={props?.trades} />,
  },
  {
    id: "profit-factor",
    title: "Profit Factor",
    description: "Profit/Loss ratio",
    category: "Analytics",
    span: 1,
    rowSpan: 1,
    component: (props) => <StatsWidget widgetId="profit-factor" trades={props?.trades} />,
  },
  {
    id: "win-rate",
    title: "Win Rate",
    description: "Percent profitable trades",
    category: "Analytics",
    span: 1,
    rowSpan: 1,
    component: (props) => <StatsWidget widgetId="win-rate" trades={props?.trades} />,
  },
  {
    id: "avg-pnl-return",
    title: "Average Return",
    description: "Avg PnL per trade",
    category: "Analytics",
    span: 1,
    rowSpan: 1,
    component: (props) => <StatsWidget widgetId="avg-pnl-return" trades={props?.trades} />,
  },
  {
    id: "total-trades",
    title: "Total Trades",
    description: "Number of trades",
    category: "Analytics",
    span: 1,
    rowSpan: 1,
    component: (props) => <StatsWidget widgetId="total-trades" trades={props?.trades} />,
  },

  // Trading (main widgets)
  {
    id: "daily-pnl-chart",
    title: "Performance Chart",
    description: "P/L over time",
    category: "Trading",
    span: 2,
    rowSpan: 1,
    component: (props) => <DailyPnlChart trades={props?.trades} />,
  },
  {
    id: "watchlist",
    title: "Watchlist",
    description: "Your tracked symbols",
    category: "Trading",
    span: 1,
    rowSpan: 2,
    component: () => <WatchlistTable rpp={5} />,
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Order shortcuts & templates",
    category: "Tools",
    span: 1,
    rowSpan: 1,
    component: (props) => <QuickActionsWidget editing={props?.editing ?? false} />,
  },
  {
    id: "pnl-calender",
    title: "PnL Calendar",
    description: "Track PnL over dates",
    category: "Trading",
    span: 2,
    rowSpan: 2,
    component: (props) => <PnlCalendar trades={props?.trades} />,
  },
  {
    id: "eps-dates",
    title: "Earnings Dates",
    description: "This week’s top earnings",
    category: "Market",
    span: 1,
    rowSpan: 2,
    component: () => <EarningsTable rpp={4} />,
  },
  { id: "equity-curve", title: "Equity Curve", description: "Cumulative P&L", category: "Trading", span: 2, rowSpan: 2 },
  { id: "market-summary", title: "Market Summary", description: "Indices & movers", category: "Market", span: 1, rowSpan: 1 },
];

