// wsManager.ts
// Relay so all browser clients share one Finnhub socket

export type WSMessage = Record<string, unknown>;
type Listener = (msg: WSMessage) => void;

export class WSManager {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];

  constructor(private wsUrl?: string) {}

  // Fetch WS URL from API if not provided
  async init() {
    if (!this.wsUrl) {
      try {
        const res = await fetch("/api/wsfinnhub");
        if (!res.ok) throw new Error("Failed to fetch WS URL");
        const data: { wsUrl: string } = await res.json();
        this.wsUrl = data.wsUrl;
      } catch (err: unknown) {
        console.error("WSManager init error:", err);
        return; // exit early if fetch fails
      }
    }

    if (!this.wsUrl) return;

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => console.log("WS connected");
    this.ws.onclose = () => console.log("WS disconnected");
    this.ws.onerror = (err: Event) => console.error("WS error", err);

    this.ws.onmessage = (evt: MessageEvent<string>) => {
      try {
        const data: WSMessage = JSON.parse(evt.data);
        console.log(data);
        this.listeners.forEach((cb) => cb(data));
      } catch (err: unknown) {
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
    this.ws?.close();
    this.ws = null;
    this.listeners = [];
  }
}