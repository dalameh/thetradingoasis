// wsManager.ts
// Relay so all browser clients share one Finnhub socket

export type WSMessage = Record<string, unknown>;
type Listener = (msg: WSMessage) => void;

export class WSManager {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private closedByUser = false;   // 👈 track manual closes

  constructor(private wsUrl?: string) {}

  async init() {
    if (this.closedByUser) return; // 👈 do nothing if closed by user

    if (!this.wsUrl) {
      try {
        const res = await fetch("/api/wsfinnhub");
        if (!res.ok) throw new Error("Failed to fetch WS URL");
        const data: { wsUrl: string } = await res.json();
        this.wsUrl = data.wsUrl;
      } catch (err) {
        console.error("WSManager init error:", err);
        return;
      }
    }

    if (!this.wsUrl) return;

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => console.log("WS connected");
    this.ws.onclose = () => {
      console.log("WS disconnected");
      this.ws = null;
    };
    this.ws.onerror = (err) => console.error("WS error", err);

    this.ws.onmessage = (evt) => {
      try {
        const data: WSMessage = JSON.parse(evt.data);
        this.listeners.forEach((cb) => cb(data));
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };
  }

  subscribe(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", symbol }));
    }
  }

  unsubscribe(symbol: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "unsubscribe", symbol }));
    }
  }

  addListener(cb: Listener) {
    this.listeners.push(cb);
  }

  removeListener(cb: Listener) {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  close() {
    this.closedByUser = true;   // 👈 mark as closed intentionally
    this.ws?.close();
    this.ws = null;
    this.listeners = [];
  }
}