import { Badge } from "@/components/ui/badge";

const recentTrades = [
  { symbol: "AAPL", type: "Call", strike: "175", expiry: "Dec 15", pnl: "+$245", status: "closed" },
  { symbol: "MSFT", type: "Put", strike: "320", expiry: "Dec 22", pnl: "-$89", status: "closed" },
  { symbol: "TSLA", type: "Call", strike: "250", expiry: "Jan 19", pnl: "+$567", status: "open" },
  { symbol: "NVDA", type: "Put", strike: "450", expiry: "Dec 29", pnl: "+$123", status: "open" },
];

export function RecentTradesWidget() {
  return (
    <div className="space-y-3">
      {recentTrades.map((trade, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="font-medium text-foreground">{trade.symbol}</div>
            <Badge className="text-xs">
              {trade.type}
            </Badge>
            <div className="text-sm text-muted-foreground">
              ${trade.strike} | {trade.expiry}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`font-medium text-sm ${trade.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {trade.pnl}
            </div>
            <Badge 
              className="text-xs"
            >
              {trade.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}