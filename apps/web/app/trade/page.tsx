"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, ColorType } from "lightweight-charts";
import api from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────────────────
type Asset = "BTCUSDT" | "ETHUSDT" | "SOLUSDT";
type Duration = "30s" | "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
type OrderType = "LONG" | "SHORT";

interface PriceData {
  symbol: string;
  bidPrice: number;
  askPrice: number;
}

interface Order {
  orderId: string;
  asset: string;
  orderType: string;
  leverage: number;
  margin: string;
  executionPrice: string;
  executionPriceInt: string;
  qtyInt: string;
  stopLossInt: string;
  takeProfitInt: string;
  finalPnLInt: string;
  liquidationPrice: string;
  status: string;
  createdAt: string;
  closeReason?: "MANUAL" | "MARGIN_CALL" | "STOP_LOSS" | "TAKE_PROFIT";
}

const SCALE = 100_000_000; // 10^8 — all BigInt prices/quantities are scaled by this
function fromInt(val: string): number {
  return parseInt(val, 10) / SCALE;
}

const ASSETS: { symbol: Asset; label: string; icon: string }[] = [
  { symbol: "BTCUSDT", label: "BTC", icon: "₿" },
  { symbol: "ETHUSDT", label: "ETH", icon: "Ξ" },
  { symbol: "SOLUSDT", label: "SOL", icon: "◎" },
];

const DURATIONS: Duration[] = ["30s", "1m", "5m", "15m", "1h", "4h", "1d"];

// ─── Component ───────────────────────────────────────────────────────
export default function TradePage() {
  const router = useRouter();

  // State
  const [selectedAsset, setSelectedAsset] = useState<Asset>("BTCUSDT");
  const [selectedDuration, setSelectedDuration] = useState<Duration>("1m");
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const prevPricesRef = useRef<Record<string, PriceData>>({});
  const [balance, setBalance] = useState<string>("0.00");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [closedOrders, setClosedOrders] = useState<Order[]>([]);
  const [positionTab, setPositionTab] = useState<"open" | "closed">("open");

  // Order form
  const [orderType, setOrderType] = useState<OrderType>("LONG");
  const [leverage, setLeverage] = useState(10);
  const [qty, setQty] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Chart
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const bidLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const askLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const selectedAssetRef = useRef<Asset>(selectedAsset);
  const selectedDurationRef = useRef<Duration>(selectedDuration);

  const orderTypeRef = useRef<OrderType>(orderType);

  // Keep refs in sync with state
  useEffect(() => { selectedAssetRef.current = selectedAsset; }, [selectedAsset]);
  useEffect(() => { selectedDurationRef.current = selectedDuration; }, [selectedDuration]);
  useEffect(() => { orderTypeRef.current = orderType; }, [orderType]);

  // Resizable sidebar
  const SIDEBAR_MIN = 220;
  const SIDEBAR_MAX = 500;
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isResizingRef = useRef(false);

  // Resizable positions panel (drag vertically)
  const PANEL_MIN = 120;
  const PANEL_MAX = 500;
  const [panelHeight, setPanelHeight] = useState(200);
  const isResizingPanelRef = useRef(false);
  const centerColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current) {
        const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingPanelRef.current && centerColumnRef.current) {
        const rect = centerColumnRef.current.getBoundingClientRect();
        const newHeight = Math.min(PANEL_MAX, Math.max(PANEL_MIN, rect.bottom - e.clientY));
        setPanelHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      if (isResizingPanelRef.current) {
        isResizingPanelRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Resize chart when sidebar width or panel height changes
  useEffect(() => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }
  }, [sidebarWidth, panelHeight]);

  // Toggle bid/ask price line visibility based on order type
  useEffect(() => {
    const isBuy = orderType === "LONG";
    if (bidLineRef.current) {
      bidLineRef.current.applyOptions({ lineVisible: !isBuy, axisLabelVisible: !isBuy });
    }
    if (askLineRef.current) {
      askLineRef.current.applyOptions({ lineVisible: isBuy, axisLabelVisible: isBuy });
    }
  }, [orderType]);

  // ─── WebSocket for live prices (ticket-based auth) ─────────────────
  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    async function connect() {
      try {
        // Step 1: Get a one-time ticket from the backend
        const { data } = await api.get("/api/v1/user/ws-ticket");
        if (cancelled) return;
        const { ticket } = data;

        // Step 2: Connect to WebSocket
        ws = new WebSocket("ws://localhost:3006");

        ws.onopen = () => {
          // Step 3: Authenticate with the ticket
          ws!.send(JSON.stringify({
            type: "auth",
            ticket,
            clientId: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "price_update") {
              // Update sidebar prices
              setPrices((prev) => {
                prevPricesRef.current = prev;
                return {
                  ...prev,
                  [msg.symbol]: {
                    symbol: msg.symbol,
                    bidPrice: msg.data.bidPrice,
                    askPrice: msg.data.askPrice,
                  },
                };
              });

              // Update chart if this is the currently selected asset
              if (msg.symbol === selectedAssetRef.current && seriesRef.current) {
                const bidPrice = msg.data.bidPrice;
                const askPrice = msg.data.askPrice;
                const midPrice = (bidPrice + askPrice) / 2;

                // Update candle
                if (lastCandleRef.current) {
                  const candle = lastCandleRef.current;
                  const updated: CandlestickData = {
                    ...candle,
                    close: midPrice,
                    high: Math.max(candle.high as number, midPrice),
                    low: Math.min(candle.low as number, midPrice),
                  };
                  lastCandleRef.current = updated;
                  seriesRef.current.update(updated);
                }

                // Update bid/ask price lines
                if (bidLineRef.current) {
                  bidLineRef.current.applyOptions({ price: bidPrice, title: `Bid ${bidPrice.toFixed(2)}` });
                }
                if (askLineRef.current) {
                  askLineRef.current.applyOptions({ price: askPrice, title: `Ask ${askPrice.toFixed(2)}` });
                }
              }
            }
          } catch {}
        };
      } catch {}
    }

    connect();

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, []);

  // ─── Fetch user info ───────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/v1/user/me")
      .then(({ data }) => { if (data?.user?.email) setUserEmail(data.user.email); })
      .catch(() => {});
  }, []);

  // ─── Close profile menu on outside click ──────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Sign out ─────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await api.post("/api/v1/user/signout");
    router.push("/signin");
  };

  // ─── Fetch balance ─────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    try {
      const { data } = await api.get("/api/v1/order/user/balance");
      setBalance(data.balance?.balance || "0.00");
    } catch (err: any) {
      if (err.response?.status === 401) router.push("/signin");
    }
  }, [router]);

  // ─── Fetch orders ──────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const [openRes, closedRes] = await Promise.all([
        api.get("/api/v1/order/user/orders?status=OPEN"),
        api.get("/api/v1/order/user/orders?status=CLOSED"),
      ]);
      setOrders(openRes.data.orders || []);
      setClosedOrders(closedRes.data.orders || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchOrders();
    const interval = setInterval(() => {
      fetchBalance();
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBalance, fetchOrders]);

  // ─── Chart ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = null;
    seriesRef.current = null;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1a1a2e" },
        textColor: "#8a8a9a",
      },
      grid: {
        vertLines: { color: "#2a2a3e" },
        horzLines: { color: "#2a2a3e" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        vertLine: { color: "#555" },
        horzLine: { color: "#555" },
      },
      timeScale: {
        borderColor: "#2a2a3e",
        timeVisible: true,
        secondsVisible: selectedDuration === "30s",
      },
      rightPriceScale: {
        borderColor: "#2a2a3e",
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Create bid/ask price lines (only one visible at a time based on orderType)
    const isBuy = orderTypeRef.current === "LONG";
    bidLineRef.current = series.createPriceLine({
      price: 0,
      color: "#ff9800",
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: !isBuy,
      lineVisible: !isBuy,
      title: "Bid",
    });
    askLineRef.current = series.createPriceLine({
      price: 0,
      color: "#42a5f5",
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: isBuy,
      lineVisible: isBuy,
      title: "Ask",
    });

    // Fetch candle data
    api.get(`/candles?asset=${selectedAsset}&duration=${selectedDuration}`)
      .then(({ data }) => {
        if (data.candles && data.candles.length > 0) {
          const candles = data.candles as CandlestickData[];
          series.setData(candles);
          lastCandleRef.current = candles[candles.length - 1];
          chart.timeScale().fitContent();
        }
      })
      .catch(console.error);

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [selectedAsset, selectedDuration]);

  // ─── Open order ────────────────────────────────────────────────────
  async function handleOpenOrder() {
    setOrderError("");
    setOrderLoading(true);
    try {
      const body: Record<string, unknown> = {
        orderType,
        asset: selectedAsset,
        leverage,
        qty: Number(qty),
      };
      if (stopLoss) body.stopLoss = Number(stopLoss);
      if (takeProfit) body.takeProfit = Number(takeProfit);

      await api.post("/api/v1/order/open", body);
      setQty("");
      setStopLoss("");
      setTakeProfit("");
      fetchBalance();
      fetchOrders();
    } catch (err: any) {
      setOrderError(err.response?.data?.message || "Something went wrong");
    } finally {
      setOrderLoading(false);
    }
  }

  // ─── Close order ───────────────────────────────────────────────────
  async function handleCloseOrder(orderId: string) {
    try {
      const { data } = await api.post(`/api/v1/order/close/${orderId}`);
      fetchBalance();
      if (data.order) {
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        setClosedOrders((prev) => [data.order, ...prev]);
      } else {
        fetchOrders();
      }
    } catch {}
  }

  // ─── Current price for selected asset ──────────────────────────────
  const currentPrice = prices[selectedAsset];

  // ─── Compute real-time PnL for open orders using live prices ──────
  const computePnL = (order: Order): number => {
    const livePrice = prices[order.asset];
    if (!livePrice) return 0;
    const entry = fromInt(order.executionPriceInt);
    const qty = fromInt(order.qtyInt);
    const current = (livePrice.bidPrice + livePrice.askPrice) / 2;
    if (order.orderType === "LONG") return (current - entry) * qty;
    return (entry - current) * qty;
  };

  const totalPnL = orders.reduce((sum, o) => sum + computePnL(o), 0);
  const equity = parseFloat(balance) + totalPnL;

  return (
    <div className="flex flex-col" style={{ height: "100vh", backgroundColor: "#131722", color: "#d1d4dc", fontFamily: "sans-serif" }}>

      {/* ─── Top Bar ───────────────────────────────────── */}
      <div className="flex items-center" style={{ height: "48px", borderBottom: "1px solid #2a2a3e", padding: "0 16px", gap: "24px" }}>
        {ASSETS.map((a) => (
          <button
            key={a.symbol}
            onClick={() => setSelectedAsset(a.symbol)}
            style={{
              background: selectedAsset === a.symbol ? "#1e222d" : "transparent",
              color: selectedAsset === a.symbol ? "#FFB800" : "#8a8a9a",
              border: "none",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{a.icon}</span>
            <span>{a.label}/USD</span>
          </button>
        ))}

        <div className="flex-1" />

        <span style={{ fontSize: "13px", color: "#8a8a9a", display: "flex", gap: "16px" }}>
          <span>Balance: <span style={{ color: "#d1d4dc", fontWeight: 600 }}>${balance}</span></span>
          {orders.length > 0 && (
            <>
              <span>Equity: <span style={{ color: equity >= parseFloat(balance) ? "#26a69a" : "#ef5350", fontWeight: 600 }}>${equity.toFixed(2)}</span></span>
              <span>P/L: <span style={{ color: totalPnL >= 0 ? "#26a69a" : "#ef5350", fontWeight: 600 }}>{totalPnL >= 0 ? "+" : ""}{totalPnL.toFixed(2)} USD</span></span>
            </>
          )}
        </span>

        {/* Profile button */}
        <div ref={profileMenuRef} style={{ position: "relative", marginLeft: "16px" }}>
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#2a2a3e",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d4dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {showProfileMenu && (
            <div style={{
              position: "absolute",
              top: "40px",
              right: 0,
              backgroundColor: "#1e222d",
              border: "1px solid #2a2a3e",
              borderRadius: "8px",
              padding: "8px 0",
              minWidth: "220px",
              zIndex: 100,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {/* User email */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a3e", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#2a2a3e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={{ fontSize: "13px", color: "#d1d4dc" }}>{userEmail || "—"}</span>
              </div>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: "#d1d4dc",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#2a2a3e"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Layout ───────────────────────────────── */}
      <div className="flex flex-1" style={{ overflow: "hidden" }}>

        {/* ─── Left Sidebar: Instruments ─────────────────── */}
        <div style={{ width: `${sidebarWidth}px`, minWidth: `${SIDEBAR_MIN}px`, maxWidth: `${SIDEBAR_MAX}px`, display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ padding: "12px 12px 8px", fontSize: "12px", fontWeight: 700, color: "#d1d4dc", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Instruments
          </div>
          {/* Column headers */}
          <div style={{ display: "flex", padding: "4px 12px 8px", fontSize: "10px", color: "#6a6a7a", fontWeight: 600, borderBottom: "1px solid #2a2a3e" }}>
            <div style={{ flex: 1 }}>Symbol</div>
            <div style={{ width: "80px", textAlign: "right" }}>Bid</div>
            <div style={{ width: "80px", textAlign: "right" }}>Ask</div>
          </div>
          {/* Scrollable asset list */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
            {ASSETS.map((a) => {
              const p = prices[a.symbol];
              const prev = prevPricesRef.current[a.symbol];
              const bidUp = p && prev ? p.bidPrice >= prev.bidPrice : true;
              const askUp = p && prev ? p.askPrice >= prev.askPrice : true;
              return (
                <div
                  key={a.symbol}
                  onClick={() => setSelectedAsset(a.symbol)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    cursor: "pointer",
                    backgroundColor: selectedAsset === a.symbol ? "#1e222d" : "transparent",
                    borderLeft: selectedAsset === a.symbol ? "3px solid #FFB800" : "3px solid transparent",
                    borderBottom: "1px solid #1e222d",
                    minWidth: "fit-content",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{a.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#d1d4dc", whiteSpace: "nowrap" }}>{a.label}</span>
                  </div>
                  <div style={{
                    width: "80px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    color: p ? (bidUp ? "#26a69a" : "#ef5350") : "#6a6a7a",
                    backgroundColor: p ? (bidUp ? "rgba(38,166,154,0.12)" : "rgba(239,83,80,0.12)") : "transparent",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    marginRight: "8px",
                    transition: "color 0.15s",
                  }}>
                    {p ? p.bidPrice.toFixed(2) : "—"}
                  </div>
                  <div style={{
                    width: "80px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    color: p ? (askUp ? "#26a69a" : "#ef5350") : "#6a6a7a",
                    backgroundColor: p ? (askUp ? "rgba(38,166,154,0.12)" : "rgba(239,83,80,0.12)") : "transparent",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    transition: "color 0.15s",
                  }}>
                    {p ? p.askPrice.toFixed(2) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Drag handle */}
          <div
            onMouseDown={() => {
              isResizingRef.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "5px",
              height: "100%",
              cursor: "col-resize",
              backgroundColor: "transparent",
              zIndex: 10,
              borderRight: "1px solid #2a2a3e",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#FFB800"; }}
            onMouseLeave={(e) => { if (!isResizingRef.current) (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
          />
        </div>

        {/* ─── Center: Chart + Positions ────────────────── */}
        <div ref={centerColumnRef} className="flex flex-col flex-1" style={{ overflow: "hidden" }}>

          {/* Timeframe selector */}
          <div className="flex items-center" style={{ padding: "8px 16px", gap: "4px", borderBottom: "1px solid #2a2a3e" }}>
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                style={{
                  background: selectedDuration === d ? "#2962ff" : "transparent",
                  color: selectedDuration === d ? "#fff" : "#8a8a9a",
                  border: "none",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                {d}
              </button>
            ))}

            {currentPrice && (
              <div className="flex-1 text-right" style={{ fontSize: "12px" }}>
                <span style={{ color: "#8a8a9a" }}>Bid </span>
                <span style={{ color: "#ef5350", fontWeight: 600 }}>{currentPrice.bidPrice.toFixed(2)}</span>
                <span style={{ color: "#8a8a9a", marginLeft: "12px" }}>Ask </span>
                <span style={{ color: "#26a69a", fontWeight: 600 }}>{currentPrice.askPrice.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Chart */}
          <div ref={chartContainerRef} className="flex-1" style={{ minHeight: 0 }} />

          {/* Positions panel */}
          <div style={{ height: `${panelHeight}px`, minHeight: `${PANEL_MIN}px`, display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Vertical drag handle */}
            <div
              onMouseDown={() => {
                isResizingPanelRef.current = true;
                document.body.style.cursor = "row-resize";
                document.body.style.userSelect = "none";
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "5px",
                cursor: "row-resize",
                backgroundColor: "transparent",
                zIndex: 10,
                borderTop: "1px solid #2a2a3e",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#FFB800"; }}
              onMouseLeave={(e) => { if (!isResizingPanelRef.current) (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
            />
            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid #2a2a3e" }}>
              <button
                onClick={() => setPositionTab("open")}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: positionTab === "open" ? "#d1d4dc" : "#8a8a9a",
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: positionTab === "open" ? "#2962ff" : "transparent",
                  cursor: "pointer",
                }}
              >
                Open ({orders.length})
              </button>
              <button
                onClick={() => setPositionTab("closed")}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: positionTab === "closed" ? "#d1d4dc" : "#8a8a9a",
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottomStyle: "solid",
                  borderBottomWidth: "2px",
                  borderBottomColor: positionTab === "closed" ? "#2962ff" : "transparent",
                  cursor: "pointer",
                }}
              >
                Closed ({closedOrders.length})
              </button>
            </div>

            {/* Table header */}
            <div style={{ display: "flex", padding: "8px 16px", fontSize: "10px", color: "#6a6a7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #2a2a3e" }}>
              <div style={{ flex: 1, minWidth: "70px" }}>Symbol</div>
              <div style={{ flex: 0.7, minWidth: "55px" }}>Type</div>
              <div style={{ flex: 1, minWidth: "80px", textAlign: "right" }}>Volume</div>
              <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right" }}>Open price</div>
              <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right" }}>{positionTab === "closed" ? "Close price" : "Current price"}</div>
              <div style={{ flex: 1, minWidth: "80px", textAlign: "right" }}>S/L</div>
              <div style={{ flex: 1, minWidth: "80px", textAlign: "right" }}>T/P</div>
              <div style={{ flex: 1, minWidth: "80px", textAlign: "right" }}>P/L, USD</div>
              <div style={{ width: "80px" }} />
            </div>

            {/* Positions list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {positionTab === "open" && orders.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "#8a8a9a", fontSize: "13px" }}>
                  No open positions
                </div>
              )}
              {positionTab === "closed" && closedOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "#8a8a9a", fontSize: "13px" }}>
                  No closed positions
                </div>
              )}

              {positionTab === "open" &&
                orders.map((o) => {
                  const pnl = computePnL(o);
                  const livePrice = prices[o.asset];
                  const currentMid = livePrice ? ((livePrice.bidPrice + livePrice.askPrice) / 2).toFixed(2) : "—";
                  const assetLabel = o.asset.replace("USDT", "");
                  const sl = o.stopLossInt && o.stopLossInt !== "0" ? fromInt(o.stopLossInt) : null;
                  const tp = o.takeProfitInt && o.takeProfitInt !== "0" ? fromInt(o.takeProfitInt) : null;
                  return (
                    <div
                      key={o.orderId}
                      style={{ display: "flex", alignItems: "center", padding: "10px 16px", fontSize: "12px", borderBottom: "1px solid #1e222d" }}
                    >
                      <div style={{ flex: 1, minWidth: "70px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 600, color: "#d1d4dc" }}>{assetLabel}</span>
                      </div>
                      <div style={{ flex: 0.7, minWidth: "55px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: o.orderType === "LONG" ? "#26a69a" : "#ef5350" }} />
                        <span style={{ color: "#d1d4dc" }}>{o.orderType === "LONG" ? "Buy" : "Sell"}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: "#d1d4dc" }}>{fromInt(o.qtyInt).toFixed(8)}</div>
                      <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right", color: "#8a8a9a", fontFamily: "monospace" }}>{parseFloat(o.executionPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right", color: "#d1d4dc", fontFamily: "monospace" }}>{currentMid !== "—" ? parseFloat(currentMid).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: sl ? "#ef5350" : "#6a6a7a", fontFamily: "monospace" }}>{sl ? sl.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: tp ? "#26a69a" : "#6a6a7a", fontFamily: "monospace" }}>{tp ? tp.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", fontWeight: 600, fontFamily: "monospace", color: pnl >= 0 ? "#26a69a" : "#ef5350" }}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </div>
                      <div style={{ width: "80px", textAlign: "right" }}>
                        <button
                          onClick={() => handleCloseOrder(o.orderId)}
                          style={{
                            background: "none",
                            color: "#8a8a9a",
                            border: "1px solid #2a2a3e",
                            padding: "4px 12px",
                            borderRadius: "3px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef5350"; e.currentTarget.style.color = "#ef5350"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.color = "#8a8a9a"; }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })}

              {positionTab === "closed" &&
                closedOrders.map((o) => {
                  const pnl = fromInt(o.finalPnLInt);
                  const assetLabel = o.asset.replace("USDT", "");
                  const sl = o.stopLossInt && o.stopLossInt !== "0" ? fromInt(o.stopLossInt) : null;
                  const tp = o.takeProfitInt && o.takeProfitInt !== "0" ? fromInt(o.takeProfitInt) : null;
                  // Compute close price: LONG: entry + PnL/qty, SHORT: entry - PnL/qty
                  const entryPrice = fromInt(o.executionPriceInt);
                  const qty = fromInt(o.qtyInt);
                  const closePrice = qty > 0
                    ? (o.orderType === "LONG" ? entryPrice + pnl / qty : entryPrice - pnl / qty)
                    : entryPrice;
                  return (
                    <div
                      key={o.orderId}
                      style={{ display: "flex", alignItems: "center", padding: "10px 16px", fontSize: "12px", borderBottom: "1px solid #1e222d" }}
                    >
                      <div style={{ flex: 1, minWidth: "70px", fontWeight: 600, color: "#d1d4dc" }}>{assetLabel}</div>
                      <div style={{ flex: 0.7, minWidth: "55px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: o.orderType === "LONG" ? "#26a69a" : "#ef5350" }} />
                        <span style={{ color: "#d1d4dc" }}>{o.orderType === "LONG" ? "Buy" : "Sell"}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: "#d1d4dc" }}>{fromInt(o.qtyInt).toFixed(8)}</div>
                      <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right", color: "#8a8a9a", fontFamily: "monospace" }}>{parseFloat(o.executionPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div style={{ flex: 1.1, minWidth: "90px", textAlign: "right", color: "#d1d4dc", fontFamily: "monospace" }}>{closePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: sl ? "#ef5350" : "#6a6a7a", fontFamily: "monospace" }}>{sl ? sl.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", color: tp ? "#26a69a" : "#6a6a7a", fontFamily: "monospace" }}>{tp ? tp.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</div>
                      <div style={{ flex: 1, minWidth: "80px", textAlign: "right", fontWeight: 600, fontFamily: "monospace", color: pnl >= 0 ? "#26a69a" : "#ef5350" }}>
                        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                      </div>
                      <div style={{ width: "80px", textAlign: "center" }}>
                        {(() => {
                          const reason = o.closeReason;
                          const cfg = reason === "MARGIN_CALL"
                            ? { label: "Margin Call", bg: "rgba(239,83,80,0.15)", color: "#ef5350" }
                            : reason === "STOP_LOSS"
                            ? { label: "S/L", bg: "rgba(255,152,0,0.15)", color: "#ff9800" }
                            : reason === "TAKE_PROFIT"
                            ? { label: "T/P", bg: "rgba(38,166,154,0.15)", color: "#26a69a" }
                            : { label: "Manual", bg: "rgba(138,138,154,0.15)", color: "#8a8a9a" };
                          return (
                            <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ─── Right Sidebar: Order Form ────────────────── */}
        <div style={{ width: "280px", borderLeft: "1px solid #2a2a3e", padding: "16px", overflowY: "auto" }}>

          <div style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc", marginBottom: "16px" }}>
            {ASSETS.find((a) => a.symbol === selectedAsset)?.label}/USD
          </div>

          {/* Sell / Buy buttons */}
          <div className="flex" style={{ gap: "4px", marginBottom: "16px" }}>
            <button
              onClick={() => setOrderType("SHORT")}
              style={{
                flex: 1,
                padding: "12px 8px",
                background: orderType === "SHORT" ? "#ef5350" : "#1e222d",
                color: orderType === "SHORT" ? "#fff" : "#8a8a9a",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div>Sell</div>
              {currentPrice && (
                <div style={{ fontSize: "14px", marginTop: "2px" }}>{currentPrice.bidPrice.toFixed(2)}</div>
              )}
            </button>
            <button
              onClick={() => setOrderType("LONG")}
              style={{
                flex: 1,
                padding: "12px 8px",
                background: orderType === "LONG" ? "#26a69a" : "#1e222d",
                color: orderType === "LONG" ? "#fff" : "#8a8a9a",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div>Buy</div>
              {currentPrice && (
                <div style={{ fontSize: "14px", marginTop: "2px" }}>{currentPrice.askPrice.toFixed(2)}</div>
              )}
            </button>
          </div>

          {/* Leverage */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: "#8a8a9a", display: "block", marginBottom: "6px" }}>
              Leverage: {leverage}x
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#FFB800" }}
            />
            <div className="flex" style={{ justifyContent: "space-between", fontSize: "10px", color: "#8a8a9a" }}>
              <span>1x</span>
              <span>100x</span>
            </div>
          </div>

          {/* Volume */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: "#8a8a9a", display: "block", marginBottom: "6px" }}>Volume (USD)</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                background: "#1e222d",
                border: "1px solid #2a2a3e",
                borderRadius: "4px",
                padding: "10px",
                color: "#d1d4dc",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Take Profit */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: "#8a8a9a", display: "block", marginBottom: "6px" }}>Take Profit</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Not set"
              style={{
                width: "100%",
                background: "#1e222d",
                border: "1px solid #2a2a3e",
                borderRadius: "4px",
                padding: "10px",
                color: "#d1d4dc",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Stop Loss */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", color: "#8a8a9a", display: "block", marginBottom: "6px" }}>Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Not set"
              style={{
                width: "100%",
                background: "#1e222d",
                border: "1px solid #2a2a3e",
                borderRadius: "4px",
                padding: "10px",
                color: "#d1d4dc",
                fontSize: "13px",
              }}
            />
          </div>

          {orderError && (
            <p style={{ color: "#ef5350", fontSize: "12px", marginBottom: "12px" }}>{orderError}</p>
          )}

          {/* Place Order */}
          <button
            onClick={handleOpenOrder}
            disabled={orderLoading || !qty}
            style={{
              width: "100%",
              padding: "14px",
              background: orderType === "LONG" ? "#26a69a" : "#ef5350",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: orderLoading || !qty ? "not-allowed" : "pointer",
              opacity: orderLoading || !qty ? 0.5 : 1,
            }}
          >
            {orderLoading
              ? "Placing..."
              : `${orderType === "LONG" ? "Buy" : "Sell"} ${ASSETS.find((a) => a.symbol === selectedAsset)?.label}/USD`}
          </button>
        </div>
      </div>
    </div>
  );
}
