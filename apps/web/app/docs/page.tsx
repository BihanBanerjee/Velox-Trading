import Link from "next/link";

export default function Docs() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-dark">
            velox
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-600 hover:text-dark transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-dark bg-brand px-5 py-2.5 rounded-lg hover:brightness-110 transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* ── Title ── */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-dark tracking-tight leading-tight mb-6">
            Velox{" "}
            <span className="bg-gradient-to-r from-brand via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed font-mono">
            Explore the technical architecture and implementation details of a
            high-performance leveraged trading engine.
          </p>
        </div>

        {/* ── System Architecture ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              System Architecture
            </h2>
          </div>
          <div className="p-8">
            <div className="mb-8">
              <img
                src="/images/architecture.png"
                alt="Velox System Architecture"
                className="w-full max-w-4xl mx-auto border border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {[
                { name: "Price Poller", desc: "Binance WS" },
                { name: "Liquidation Engine", desc: "In-Memory State" },
                { name: "HTTP API", desc: "Express 5" },
                { name: "WS Server", desc: "Real-time" },
                { name: "DB Worker", desc: "Persistence" },
                { name: "Batch Uploader", desc: "TimescaleDB" },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="bg-trade-bg border border-trade-border rounded-lg p-4 text-center"
                >
                  <div className="text-white text-xs font-semibold mb-1">
                    {svc.name}
                  </div>
                  <div className="text-trade-muted text-[10px]">{svc.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Velox follows a distributed microservices architecture with six
              services communicating through Redis streams. Real-time price data
              flows from Binance via WebSocket, gets processed by the
              liquidation engine with in-memory state, and triggers automatic
              liquidations based on leverage and risk parameters. All state
              changes are event-sourced for crash recovery.
            </p>
          </div>
        </section>

        {/* ── Core Components ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              Core Components & Implementation
            </h2>
          </div>
          <div className="p-8 space-y-12">
            {/* Liquidation Engine */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Liquidation Engine
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Order Processing
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>
                      The engine processes orders through Redis streams with
                      real-time price validation:
                    </p>
                    <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                      <div>
                        • Validates leverage (1–100x) and user balance
                      </div>
                      <div>
                        • Fetches current bid/ask from Redis
                      </div>
                      <div>
                        • Volume = (margin × leverage) / price
                      </div>
                      <div>
                        • Deducts required margin from balance
                      </div>
                      <div>
                        • Calculates liquidation price (90% loss threshold)
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Liquidation Mechanism
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>
                      Runs on every price tick with priority-ordered triggers:
                    </p>
                    <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                      <div>
                        • Margin Call: remaining margin ≤ 10% of initial
                      </div>
                      <div>
                        • Stop Loss: user-defined loss threshold reached
                      </div>
                      <div>
                        • Take Profit: user-defined profit target hit
                      </div>
                      <div>
                        • LONG closes at BID, SHORT closes at ASK
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-medium mb-4">
                  Liquidation Price Formulas
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs">
                    <div className="text-trade-muted text-[10px] uppercase tracking-wide mb-2">
                      Long Position
                    </div>
                    <div>
                      P<sub>liq</sub> = P₀ × (1 − 90 / (100 × L))
                    </div>
                    <div className="text-trade-muted mt-2 text-[11px]">
                      Liquidates when price drops to this level
                    </div>
                  </div>
                  <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs">
                    <div className="text-trade-muted text-[10px] uppercase tracking-wide mb-2">
                      Short Position
                    </div>
                    <div>
                      P<sub>liq</sub> = P₀ × (1 + 90 / (100 × L))
                    </div>
                    <div className="text-trade-muted mt-2 text-[11px]">
                      Liquidates when price rises to this level
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redis Streams */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Redis Stream Communication
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border border-gray-200 p-5">
                  <h5 className="font-semibold text-sm mb-3">
                    request:stream
                  </h5>
                  <div className="text-xs font-mono text-gray-500 space-y-1">
                    <div>PRICE_UPDATE</div>
                    <div>PLACE_ORDER</div>
                    <div>CLOSE_ORDER</div>
                    <div>REGISTER_USER</div>
                    <div>GET_BALANCE</div>
                    <div>GET_USER_ORDERS</div>
                  </div>
                </div>
                <div className="border border-gray-200 p-5">
                  <h5 className="font-semibold text-sm mb-3">
                    response:stream
                  </h5>
                  <div className="text-xs font-mono text-gray-500 space-y-1">
                    <div>Order confirmations</div>
                    <div>Liquidation events</div>
                    <div>Balance responses</div>
                    <div className="text-trade-muted pt-1 text-[10px]">
                      Consumed by DB Worker
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 p-5">
                  <h5 className="font-semibold text-sm mb-3">
                    response:queue
                  </h5>
                  <div className="text-xs font-mono text-gray-500 space-y-1">
                    <div>Request-response callbacks</div>
                    <div>5-second timeout</div>
                    <div>Deleted after dispatch</div>
                    <div className="text-trade-muted pt-1 text-[10px]">
                      Consumed by HTTP API
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Poller */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Price Poller & WebSocket Integration
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Binance Connection
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>
                      Connects to Binance for real-time trade feeds on three
                      assets:
                    </p>
                    <div className="bg-trade-bg text-white p-4 font-mono text-xs rounded-lg">
                      {`wss://stream.binance.com:9443/ws

Subscriptions:
  btcusdt@trade
  ethusdt@trade
  solusdt@trade`}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    House Spread (0.1%)
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>
                      A market-maker spread is applied to all prices before
                      distribution:
                    </p>
                    <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                      <div>bidPrice = price × (1 − 0.001)</div>
                      <div>askPrice = price × (1 + 0.001)</div>
                      <div className="pt-2 text-gray-400">
                        Honest price (no spread) is sent to TimescaleDB for candle
                        aggregation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Web Server */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Web Server & API Layer
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    Authentication
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>Dual authentication with JWT in httpOnly cookies:</p>
                    <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                      <div>• Password-based: bcrypt hashing + JWT</div>
                      <div>• Magic link: Resend API + Redis token store</div>
                      <div>• httpOnly secure cookies (no localStorage)</div>
                      <div>• One-time WS tickets (30s TTL)</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">
                    EngineClient Service
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                    <p>Singleton for engine communication via Redis:</p>
                    <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                      <div>• Publishes to request:stream (XADD)</div>
                      <div>• Subscribes to response:queue for callbacks</div>
                      <div>• 5-second timeout per request</div>
                      <div>• Checks engine READY status before each call</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── API Reference ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              API Reference
            </h2>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-6">Authentication</h3>
                <div className="space-y-3 font-mono text-sm">
                  {[
                    ["POST", "/api/v1/user/signup"],
                    ["POST", "/api/v1/user/signin"],
                    ["POST", "/api/v1/user/magic-link"],
                    ["GET", "/api/v1/user/auth/verify"],
                    ["POST", "/api/v1/user/signout"],
                    ["GET", "/api/v1/user/me"],
                    ["GET", "/api/v1/user/ws-ticket"],
                  ].map(([method, path]) => (
                    <div
                      key={path}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                          method === "POST"
                            ? "bg-brand text-dark"
                            : "bg-trade-bg text-white"
                        }`}
                      >
                        {method}
                      </span>
                      <span className="text-gray-600 text-xs">{path}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-6">Trading</h3>
                <div className="space-y-3 font-mono text-sm">
                  {[
                    ["POST", "/api/v1/order/open"],
                    ["POST", "/api/v1/order/close/:orderId"],
                    ["GET", "/api/v1/order/user/orders"],
                    ["GET", "/api/v1/order/user/balance"],
                    ["GET", "/api/v1/order/:orderId"],
                  ].map(([method, path]) => (
                    <div
                      key={path}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                          method === "POST"
                            ? "bg-brand text-dark"
                            : "bg-trade-bg text-white"
                        }`}
                      >
                        {method}
                      </span>
                      <span className="text-gray-600 text-xs">{path}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-6">Market Data</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="bg-trade-bg text-white px-2.5 py-0.5 text-xs font-semibold rounded">
                      GET
                    </span>
                    <span className="text-gray-600 text-xs">
                      /candles?asset=&duration=
                    </span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 p-3 text-xs font-mono text-gray-500">
                  <div className="font-semibold text-gray-700 mb-1">
                    Timeframes:
                  </div>
                  30s · 1m · 5m · 15m · 1h · 4h · 1d
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-6">WebSocket</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="bg-bull text-white px-2.5 py-0.5 text-xs font-semibold rounded">
                      WS
                    </span>
                    <span className="text-gray-600 text-xs">
                      ws://localhost:3006
                    </span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 p-3 text-xs font-mono text-gray-500">
                  <div className="font-semibold text-gray-700 mb-1">
                    Auth flow:
                  </div>
                  GET /ws-ticket → connect → send auth msg
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Database Schema ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              Database Schema
            </h2>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4">User</h3>
                <div className="space-y-1.5 text-xs text-gray-600 font-mono">
                  <div>id <span className="text-gray-400">uuid pk</span></div>
                  <div>email <span className="text-gray-400">unique</span></div>
                  <div>phone <span className="text-gray-400">bigint unique</span></div>
                  <div>password <span className="text-gray-400">string</span></div>
                </div>
              </div>
              <div className="border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4">ClosedOrder</h3>
                <div className="space-y-1.5 text-xs text-gray-600 font-mono">
                  <div>orderId <span className="text-gray-400">pk</span></div>
                  <div>userId, asset, orderType</div>
                  <div>leverage <span className="text-gray-400">int</span></div>
                  <div>marginInt, executionPriceInt</div>
                  <div>closePriceInt, qtyInt</div>
                  <div>stopLossInt, takeProfitInt</div>
                  <div>finalPnLInt <span className="text-gray-400">bigint</span></div>
                  <div>closeReason <span className="text-gray-400">string?</span></div>
                  <div>createdAt, closedAt</div>
                </div>
              </div>
              <div className="border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4">Trade</h3>
                <div className="space-y-1.5 text-xs text-gray-600 font-mono">
                  <div>id <span className="text-gray-400">cuid</span></div>
                  <div>time <span className="text-gray-400">timestamptz</span></div>
                  <div>symbol <span className="text-gray-400">string</span></div>
                  <div>priceInt <span className="text-gray-400">bigint 10⁸</span></div>
                  <div>qtyInt <span className="text-gray-400">bigint 10⁸</span></div>
                  <div className="pt-1 text-[10px] text-gray-400">
                    TimescaleDB hypertable
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4">Snapshot</h3>
                <div className="space-y-1.5 text-xs text-gray-600 font-mono">
                  <div>id <span className="text-gray-400">uuid pk</span></div>
                  <div>timestamp <span className="text-gray-400">datetime</span></div>
                  <div>lastStreamId <span className="text-gray-400">string</span></div>
                  <div>data <span className="text-gray-400">json</span></div>
                  <div className="pt-1 text-[10px] text-gray-400">
                    Crash recovery snapshots
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-4 text-xs font-mono text-gray-400">
              <span>
                Assets: BTCUSDT · ETHUSDT · SOLUSDT
              </span>
              <span>|</span>
              <span>
                Order Types: LONG · SHORT
              </span>
              <span>|</span>
              <span>
                Status: OPEN · CLOSED · LIQUIDATED
              </span>
            </div>
          </div>
        </section>

        {/* ── Technical Deep Dive ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              Technical Deep Dive
            </h2>
          </div>
          <div className="p-8 space-y-12">
            {/* Data Flow */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Real-time Data Flow
              </h3>
              <div className="space-y-6">
                <div className="border border-gray-200 p-6">
                  <h4 className="text-base font-semibold mb-4">
                    Price Update Sequence
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {[
                      { label: "Binance WS", desc: "Trade feed" },
                      { label: "Price Poller", desc: "Add 0.1% spread" },
                      { label: "Redis Stream", desc: "PRICE_UPDATE" },
                      { label: "Engine", desc: "Check liquidations" },
                      { label: "WS Server", desc: "Broadcast to clients" },
                    ].map((step, i) => (
                      <div key={step.label} className="text-center">
                        <div className="bg-trade-bg text-white p-3 rounded-lg mb-2">
                          <div className="font-mono text-xs font-semibold">
                            {step.label}
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 p-6">
                  <h4 className="text-base font-semibold mb-4">
                    Order Creation Sequence
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    {[
                      { label: "Frontend", desc: "User places order" },
                      { label: "HTTP API", desc: "Validate + auth" },
                      { label: "request:stream", desc: "PLACE_ORDER" },
                      { label: "Engine", desc: "Check balance, execute" },
                      { label: "response:queue", desc: "Callback to API" },
                    ].map((step) => (
                      <div key={step.label} className="text-center">
                        <div className="bg-trade-bg text-white p-3 rounded-lg mb-2">
                          <div className="font-mono text-xs font-semibold">
                            {step.label}
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Request-Response */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Request-Response Architecture
              </h3>
              <div className="space-y-6">
                <div className="border border-gray-200 p-6">
                  <h4 className="text-base font-semibold mb-4">
                    Async Communication Pattern
                  </h4>
                  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                    <p>
                      The system uses an async request-response pattern with
                      Redis streams and an in-memory callback registry. This
                      enables non-blocking communication while maintaining
                      request-response semantics.
                    </p>
                    <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs overflow-x-auto">
                      {`// 1. HTTP API sends order to engine
const requestId = crypto.randomUUID();
await redis.xadd("request:stream", "*",
  "requestId", requestId,
  "type", "PLACE_ORDER",
  "payload", JSON.stringify({ userId, asset, leverage, qty })
);

// 2. Simultaneously register callback with timeout
const response = await subscriber.waitForMessage(requestId);
// → Promise resolves when engine publishes to response:queue
// → Rejects after 5 seconds if no response`}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 p-6">
                    <h4 className="text-base font-semibold mb-4">
                      Callback Registration
                    </h4>
                    <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs">
                      {`waitForMessage(id: string) {
  return new Promise((resolve, reject) => {
    this.callbacks[id] = resolve;

    setTimeout(() => {
      if (this.callbacks[id]) {
        delete this.callbacks[id];
        reject(new Error("Timeout"));
      }
    }, 5000);
  });
}`}
                    </div>
                  </div>
                  <div className="border border-gray-200 p-6">
                    <h4 className="text-base font-semibold mb-4">
                      Engine Processing Loop
                    </h4>
                    <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs">
                      {`while (true) {
  const entries = await redis.xread(
    "BLOCK", 0,
    "STREAMS", "request:stream", lastId
  );

  for (const [id, data] of entries) {
    switch (data.type) {
      case "PLACE_ORDER":
        await processOrder(data.payload);
        break;
      case "PRICE_UPDATE":
        await checkLiquidations(data.payload);
        break;
    }
    lastId = id;
  }
}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Crash Recovery */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                Crash Recovery & Event Sourcing
              </h3>
              <div className="border border-gray-200 p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-base font-semibold mb-4">
                      Snapshot + Replay Strategy
                    </h4>
                    <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                      <p>
                        The engine persists full state snapshots to PostgreSQL
                        every 15 seconds, including the last processed stream
                        entry ID.
                      </p>
                      <div className="bg-gray-50 p-4 font-mono text-xs space-y-1">
                        <div>• Snapshot: users, balances, all orders</div>
                        <div>• lastStreamId: replay cursor</div>
                        <div>• On restart: load snapshot → replay events</div>
                        <div>• Max data loss: 15 seconds</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold mb-4">
                      Engine Lifecycle
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          state: "STARTING",
                          desc: "Connecting to Redis & PostgreSQL",
                        },
                        {
                          state: "REPLAYING",
                          desc: "Loading snapshot + replaying stream events",
                        },
                        {
                          state: "READY",
                          desc: "Accepting requests, processing prices",
                        },
                        {
                          state: "SHUTDOWN",
                          desc: "Graceful shutdown, final snapshot",
                        },
                      ].map((s) => (
                        <div key={s.state} className="flex items-center gap-3">
                          <span className="bg-trade-bg text-brand font-mono text-xs px-3 py-1.5 rounded font-semibold min-w-[100px] text-center">
                            {s.state}
                          </span>
                          <span className="text-sm text-gray-600">
                            {s.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BigInt Arithmetic */}
            <div>
              <h3 className="text-xl font-semibold text-dark mb-6">
                BigInt Arithmetic (10⁸ Scale)
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-base font-semibold mb-4">
                    Why BigInt?
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                    <p>
                      JavaScript{" "}
                      <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                        Number
                      </code>{" "}
                      uses IEEE 754 floating point, which introduces rounding
                      errors in financial calculations. All prices, quantities,
                      and margins use BigInt with 10⁸ scale factor.
                    </p>
                    <div className="bg-trade-bg text-white p-4 rounded-lg font-mono text-xs">
                      {`PRICE_SCALE = 100_000_000n

54820.50 → 5_482_050_000_000n
0.001 BTC → 100_000n`}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-4">
                    Core Operations
                  </h4>
                  <div className="bg-trade-bg text-white p-4 rounded-lg font-mono text-xs">
                    {`toInteger(54820.50)
  → 5482050000000n

toDecimal(5482050000000n)
  → 54820.50

multiply(a, b)
  → (a × b) / SCALE

divide(a, b)
  → (a × SCALE) / b

calculateLongPnL(current, entry, qty)
  → (current - entry) × qty / SCALE`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Infrastructure ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              Docker & Infrastructure
            </h2>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  docker-compose.yml
                </h3>
                <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs">
                  {`services:
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: trading_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - timescale_data:/var/...

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data`}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Service Ports</h3>
                <div className="space-y-3">
                  {[
                    { svc: "Frontend", port: "3000", tech: "Next.js 16" },
                    { svc: "HTTP API", port: "3005", tech: "Express 5" },
                    { svc: "WS Server", port: "3006", tech: "WebSocket" },
                    { svc: "PostgreSQL", port: "5433", tech: "TimescaleDB" },
                    { svc: "Redis", port: "6380", tech: "Streams + Pub/Sub" },
                  ].map((row) => (
                    <div
                      key={row.svc}
                      className="flex items-center justify-between py-2 border-b border-gray-100 text-sm"
                    >
                      <span className="font-medium text-dark">{row.svc}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">
                          {row.tech}
                        </span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          :{row.port}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-brand-light p-4 rounded-lg">
                  <div className="font-semibold text-sm text-dark mb-1">
                    Quick Start
                  </div>
                  <div className="font-mono text-xs text-dark/70 space-y-1">
                    <div>docker compose up -d</div>
                    <div>cd packages/prisma-client && bunx prisma migrate deploy</div>
                    <div>bun start:dev</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Monorepo Structure ── */}
        <section className="border border-gray-200 mb-16">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-2xl font-semibold text-dark tracking-tight">
              Monorepo Structure
            </h2>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Apps (6 services)</h3>
                <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs space-y-2">
                  <div>
                    <span className="text-brand">apps/web/</span>{" "}
                    <span className="text-trade-muted">— Next.js frontend</span>
                  </div>
                  <div>
                    <span className="text-brand">apps/http-backend/</span>{" "}
                    <span className="text-trade-muted">— REST API gateway</span>
                  </div>
                  <div>
                    <span className="text-brand">apps/liquidation-engine/</span>{" "}
                    <span className="text-trade-muted">
                      — Stateful trading engine
                    </span>
                  </div>
                  <div>
                    <span className="text-brand">apps/realtime-server/</span>{" "}
                    <span className="text-trade-muted">— WebSocket server</span>
                  </div>
                  <div>
                    <span className="text-brand">apps/price-poller/</span>{" "}
                    <span className="text-trade-muted">— Binance integration</span>
                  </div>
                  <div>
                    <span className="text-brand">apps/db-worker/</span>{" "}
                    <span className="text-trade-muted">— Order persistence</span>
                  </div>
                  <div>
                    <span className="text-brand">apps/batch-uploader/</span>{" "}
                    <span className="text-trade-muted">— Trade tick batching</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Packages (shared libraries)
                </h3>
                <div className="bg-trade-bg text-white p-5 rounded-lg font-mono text-xs space-y-2">
                  <div>
                    <span className="text-brand">prisma-client/</span>{" "}
                    <span className="text-trade-muted">— ORM schema + client</span>
                  </div>
                  <div>
                    <span className="text-brand">redis-client/</span>{" "}
                    <span className="text-trade-muted">
                      — Stream utilities + subscriber
                    </span>
                  </div>
                  <div>
                    <span className="text-brand">redis-stream-types/</span>{" "}
                    <span className="text-trade-muted">
                      — Type-safe message definitions
                    </span>
                  </div>
                  <div>
                    <span className="text-brand">price-utils/</span>{" "}
                    <span className="text-trade-muted">
                      — BigInt arithmetic (10⁸)
                    </span>
                  </div>
                  <div>
                    <span className="text-brand">validation/</span>{" "}
                    <span className="text-trade-muted">
                      — Zod schemas + middleware
                    </span>
                  </div>
                  <div>
                    <span className="text-brand">ui/</span>{" "}
                    <span className="text-trade-muted">
                      — Shared React components
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="text-center">
          <div className="bg-trade-bg rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Ready to{" "}
              <span className="bg-gradient-to-r from-brand via-amber-400 to-orange-500 bg-clip-text text-transparent">
                explore
              </span>
              ?
            </h2>
            <p className="text-trade-muted text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              Start trading with $1,000 in virtual funds on a platform built
              with event sourcing, in-memory state, and real-time liquidation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="text-dark font-semibold text-sm bg-brand px-8 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-[0_4px_24px_rgba(255,184,0,0.25)] w-full sm:w-auto text-center"
              >
                Start Trading
              </Link>
              <Link
                href="/trade"
                className="text-white font-semibold text-sm border border-trade-border px-8 py-3.5 rounded-xl hover:bg-trade-secondary transition-colors w-full sm:w-auto text-center"
              >
                View Platform
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-dark tracking-tight">
            velox
          </span>
          <p className="text-xs text-gray-400">
            Simulated trading platform. No real funds at risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
