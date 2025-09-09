import EarningsTable from "@/components/dashboard/Widgets/EarningsTable"
import QuickActionsWidget from "@/components/dashboard/Widgets/QuickActions";
import WatchlistTable from "@/components/dashboard/Widgets/WatchlistTable";

export interface AvailableWidget {
  id: string;
  title: string;
  description: string;
  category: string;
  span: 1 | 2 | 3;
  rowSpan?: 1 | 2;
// Type is fine:
component?: (props?: { editing?: boolean }) => React.ReactNode;
}

// Example widgets
export const AVAILABLE_WIDGETS: AvailableWidget[] = [
  // Analytics
  //should only every span 1
  { id: "net-pl", title: "Net P&L", description: "Net profit & loss", category: "Analytics", span: 1, rowSpan: 1 },
  { id: "win-rate", title: "Win Rate", description: "Percent profitable trades", category: "Analytics", span: 1, rowSpan: 1 },
  { id: "volume-traded", title: "Volume Traded", description: "Trading volume", category: "Analytics", span: 1, rowSpan: 1 },
  { id: "total-trades", title: "Total Trades", description: "Number of Trades Taken", category: "Analytics", span: 1, rowSpan: 1 },

  // Trading
  { id: "performance-chart", title: "Performance Chart", description: "P/L over time", category: "Trading", span: 2, rowSpan: 1 },
  { id: "equity-curve", title: "Equity Curve", description: "Cumulative P&L", category: "Trading", span: 2, rowSpan: 2 },
  { id: "recent-trades", title: "Recent Trades", description: "Latest executions & positions", category: "Trading", span: 1, rowSpan: 1 },
  { id: "watchlist", title: "Watchlist", description: "Your tracked symbols", category: "Trading", span: 1, rowSpan: 2, component: () => <WatchlistTable rpp = {5}/>},
  { id: "open-orders", title: "Open Orders", description: "Active orders table", category: "Trading", span: 1, rowSpan: 1 },

  // Market
  { id: "eps-dates", title: "Earning Dates", description: "This Weeks Top Earnings", category: "Market", span: 1, rowSpan: 2, component: () => <EarningsTable rpp={4}/>},

  { id: "market-summary", title: "Market Summary", description: "Indices & movers", category: "Market", span: 1, rowSpan: 1 },

  // Tools
  { id: "quick-actions", title: "Quick Actions", description: "Order shortcuts & templates", category: "Tools", span: 1, rowSpan: 1,  
    component: (props) => {
    const { editing = false } = props ?? {}; // default to false if props is undefined
    return <QuickActionsWidget editing={editing} />;}
  }
];
