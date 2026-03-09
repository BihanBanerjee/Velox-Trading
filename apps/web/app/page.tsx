import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── 1. Sticky Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-dark">
            velox
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-gray-600 hover:text-dark transition-colors"
            >
              Docs
            </Link>
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

      {/* ── 2. Hero Section ── */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 bg-brand-light text-dark text-sm font-medium px-4 py-2 rounded-full mb-8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            Trade with up to 100x leverage
          </div>

          <h1 className="animate-fade-up-delay-1 text-5xl md:text-7xl font-bold text-dark tracking-tight leading-[1.08] mb-6">
            Trade Crypto.
            <br />
            <span className="bg-gradient-to-r from-brand via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Amplified.
            </span>
          </h1>

          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A professional-grade simulated trading platform with real-time charts,
            advanced order types, and up to 100x leverage — all with zero risk.
          </p>

          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/register"
              className="w-full sm:w-auto text-dark font-semibold text-sm bg-brand px-8 py-4 rounded-xl hover:brightness-110 transition-all shadow-[0_4px_24px_rgba(255,184,0,0.3)]"
            >
              Start Trading
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto text-gray-600 font-semibold text-sm bg-light-bg px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <p className="animate-fade-up-delay-4 text-xs text-gray-400">
            $1,000 virtual balance. No deposit required.
          </p>
        </div>
      </section>

      {/* ── 3. Market Preview Strip ── */}
      <section className="bg-trade-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BTC Card */}
            <div className="bg-trade-secondary rounded-2xl p-6 border border-trade-border hover:border-trade-muted/30 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg font-bold">
                    ₿
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Bitcoin</div>
                    <div className="text-trade-muted text-xs">BTC/USD</div>
                  </div>
                </div>
                <div className="text-bull text-xs font-medium">+2.4%</div>
              </div>
              <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#26a69a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,40 15,38 30,35 45,30 55,32 65,28 80,25 95,30 110,22 125,18 140,20 155,15 170,12 185,16 200,8"
                />
                <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26a69a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#26a69a" stopOpacity="0" />
                </linearGradient>
                <polygon
                  fill="url(#btcGrad)"
                  points="0,40 15,38 30,35 45,30 55,32 65,28 80,25 95,30 110,22 125,18 140,20 155,15 170,12 185,16 200,8 200,50 0,50"
                />
              </svg>
            </div>

            {/* ETH Card */}
            <div className="bg-trade-secondary rounded-2xl p-6 border border-trade-border hover:border-trade-muted/30 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg font-bold">
                    Ξ
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Ethereum</div>
                    <div className="text-trade-muted text-xs">ETH/USD</div>
                  </div>
                </div>
                <div className="text-bear text-xs font-medium">-3.2%</div>
              </div>
              <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#ef5350"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,10 15,12 30,15 50,14 65,20 80,18 100,25 115,28 130,24 145,30 165,35 180,33 200,40"
                />
                <linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef5350" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef5350" stopOpacity="0" />
                </linearGradient>
                <polygon
                  fill="url(#ethGrad)"
                  points="0,10 15,12 30,15 50,14 65,20 80,18 100,25 115,28 130,24 145,30 165,35 180,33 200,40 200,50 0,50"
                />
              </svg>
            </div>

            {/* SOL Card */}
            <div className="bg-trade-secondary rounded-2xl p-6 border border-trade-border hover:border-trade-muted/30 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg font-bold">
                    ◎
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Solana</div>
                    <div className="text-trade-muted text-xs">SOL/USD</div>
                  </div>
                </div>
                <div className="text-bull text-xs font-medium">+5.1%</div>
              </div>
              <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#26a69a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,42 15,40 30,38 50,35 65,30 80,33 100,25 115,20 130,22 145,18 165,12 180,15 200,5"
                />
                <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26a69a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#26a69a" stopOpacity="0" />
                </linearGradient>
                <polygon
                  fill="url(#solGrad)"
                  points="0,42 15,40 30,38 50,35 65,30 80,33 100,25 115,20 130,22 145,18 165,12 180,15 200,5 200,50 0,50"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Features Grid ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark tracking-tight mb-4">
              Built for Serious Traders
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every tool you need to analyze, execute, and manage positions — in one unified interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 100x Leverage */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">100x Leverage</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Amplify your positions with up to 100x leverage on all supported crypto pairs.
              </p>
            </div>

            {/* Real-Time Charts */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="2" y1="9" x2="22" y2="9" />
                  <path d="M7 15l3-3 3 3 4-4" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">Real-Time Charts</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Professional candlestick charts with multiple timeframes and technical indicators.
              </p>
            </div>

            {/* Instant Execution */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">Instant Execution</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Market and limit orders execute instantly with no slippage on simulated fills.
              </p>
            </div>

            {/* Risk Engine */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">Risk Engine</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Built-in margin management, stop-loss enforcement, and automatic liquidation protection.
              </p>
            </div>

            {/* Dual Auth */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">Dual Authentication</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Sign in with email magic links or traditional credentials — your choice, always secure.
              </p>
            </div>

            {/* Virtual Balance */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h3 className="text-dark font-semibold mb-2">Virtual Balance</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Start with $1,000 in virtual funds. Practice strategies without risking real money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="border-y border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-dark mb-1">3</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Markets</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-dark mb-1">100x</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Max Leverage</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-dark mb-1">$1K</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Virtual Balance</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-dark mb-1">0</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Fees</div>
          </div>
        </div>
      </section>

      {/* ── 5. Platform Preview Mockup ── */}
      <section className="bg-trade-bg py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Professional Trading Interface
            </h2>
            <p className="text-trade-muted max-w-xl mx-auto">
              A dark-themed workspace designed for focus and precision.
            </p>
          </div>

          <div className="bg-trade-secondary rounded-2xl border border-trade-border overflow-hidden shadow-2xl">
            {/* Mock toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-trade-border">
              <div className="flex items-center gap-4">
                <span className="text-white text-sm font-semibold">BTC/USD</span>
                <span className="text-bull text-sm font-medium">67,842.50</span>
                <span className="text-bull text-xs">+2.41%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-trade-muted text-xs">1H</span>
                <span className="text-trade-muted text-xs">4H</span>
                <span className="text-white text-xs bg-trade-border px-2 py-0.5 rounded">1D</span>
                <span className="text-trade-muted text-xs">1W</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Chart area */}
              <div className="flex-1 p-6 min-h-[280px] md:min-h-[340px]">
                <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#2a2a3e" strokeWidth="0.5" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#2a2a3e" strokeWidth="0.5" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#2a2a3e" strokeWidth="0.5" />

                  {/* Candlesticks - mix of bull and bear */}
                  {/* Bull candles (green) */}
                  <line x1="30" y1="140" x2="30" y2="90" stroke="#26a69a" strokeWidth="1" />
                  <rect x="26" y="100" width="8" height="30" fill="#26a69a" rx="1" />

                  <line x1="60" y1="130" x2="60" y2="80" stroke="#26a69a" strokeWidth="1" />
                  <rect x="56" y="90" width="8" height="25" fill="#26a69a" rx="1" />

                  {/* Bear candle (red) */}
                  <line x1="90" y1="120" x2="90" y2="70" stroke="#ef5350" strokeWidth="1" />
                  <rect x="86" y="75" width="8" height="30" fill="#ef5350" rx="1" />

                  <line x1="120" y1="130" x2="120" y2="85" stroke="#ef5350" strokeWidth="1" />
                  <rect x="116" y="90" width="8" height="25" fill="#ef5350" rx="1" />

                  {/* Bull */}
                  <line x1="150" y1="125" x2="150" y2="75" stroke="#26a69a" strokeWidth="1" />
                  <rect x="146" y="85" width="8" height="28" fill="#26a69a" rx="1" />

                  <line x1="180" y1="110" x2="180" y2="60" stroke="#26a69a" strokeWidth="1" />
                  <rect x="176" y="68" width="8" height="30" fill="#26a69a" rx="1" />

                  <line x1="210" y1="100" x2="210" y2="55" stroke="#26a69a" strokeWidth="1" />
                  <rect x="206" y="60" width="8" height="28" fill="#26a69a" rx="1" />

                  {/* Bear */}
                  <line x1="240" y1="95" x2="240" y2="50" stroke="#ef5350" strokeWidth="1" />
                  <rect x="236" y="55" width="8" height="28" fill="#ef5350" rx="1" />

                  <line x1="270" y1="110" x2="270" y2="60" stroke="#ef5350" strokeWidth="1" />
                  <rect x="266" y="65" width="8" height="30" fill="#ef5350" rx="1" />

                  {/* Bull rally */}
                  <line x1="300" y1="105" x2="300" y2="55" stroke="#26a69a" strokeWidth="1" />
                  <rect x="296" y="65" width="8" height="25" fill="#26a69a" rx="1" />

                  <line x1="330" y1="90" x2="330" y2="45" stroke="#26a69a" strokeWidth="1" />
                  <rect x="326" y="50" width="8" height="28" fill="#26a69a" rx="1" />

                  <line x1="360" y1="80" x2="360" y2="35" stroke="#26a69a" strokeWidth="1" />
                  <rect x="356" y="40" width="8" height="28" fill="#26a69a" rx="1" />

                  <line x1="390" y1="75" x2="390" y2="30" stroke="#26a69a" strokeWidth="1" />
                  <rect x="386" y="35" width="8" height="25" fill="#26a69a" rx="1" />

                  {/* Bear pullback */}
                  <line x1="420" y1="70" x2="420" y2="35" stroke="#ef5350" strokeWidth="1" />
                  <rect x="416" y="38" width="8" height="22" fill="#ef5350" rx="1" />

                  <line x1="450" y1="80" x2="450" y2="42" stroke="#ef5350" strokeWidth="1" />
                  <rect x="446" y="45" width="8" height="25" fill="#ef5350" rx="1" />

                  {/* Final bull push */}
                  <line x1="480" y1="72" x2="480" y2="28" stroke="#26a69a" strokeWidth="1" />
                  <rect x="476" y="32" width="8" height="28" fill="#26a69a" rx="1" />

                  <line x1="510" y1="60" x2="510" y2="20" stroke="#26a69a" strokeWidth="1" />
                  <rect x="506" y="25" width="8" height="22" fill="#26a69a" rx="1" />

                  <line x1="540" y1="55" x2="540" y2="15" stroke="#26a69a" strokeWidth="1" />
                  <rect x="536" y="18" width="8" height="25" fill="#26a69a" rx="1" />

                  <line x1="570" y1="50" x2="570" y2="10" stroke="#26a69a" strokeWidth="1" />
                  <rect x="566" y="14" width="8" height="24" fill="#26a69a" rx="1" />

                  {/* Volume bars */}
                  <rect x="26" y="180" width="8" height="18" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="56" y="184" width="8" height="14" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="86" y="176" width="8" height="22" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="116" y="182" width="8" height="16" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="146" y="186" width="8" height="12" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="176" y="178" width="8" height="20" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="206" y="184" width="8" height="14" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="236" y="174" width="8" height="24" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="266" y="180" width="8" height="18" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="296" y="186" width="8" height="12" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="326" y="178" width="8" height="20" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="356" y="172" width="8" height="26" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="386" y="176" width="8" height="22" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="416" y="182" width="8" height="16" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="446" y="180" width="8" height="18" fill="#ef5350" opacity="0.3" rx="1" />
                  <rect x="476" y="174" width="8" height="24" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="506" y="170" width="8" height="28" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="536" y="176" width="8" height="22" fill="#26a69a" opacity="0.3" rx="1" />
                  <rect x="566" y="178" width="8" height="20" fill="#26a69a" opacity="0.3" rx="1" />

                  {/* Price line */}
                  <line x1="0" y1="14" x2="600" y2="14" stroke="#FFB800" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.6" />
                </svg>
              </div>

              {/* Order panel sidebar */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-trade-border p-5">
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 bg-bull/10 text-bull text-xs font-semibold text-center py-2.5 rounded-lg">
                    Buy / Long
                  </div>
                  <div className="flex-1 bg-trade-bg text-trade-muted text-xs font-medium text-center py-2.5 rounded-lg">
                    Sell / Short
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <div className="text-trade-muted text-xs mb-1.5">Order Type</div>
                    <div className="bg-trade-bg border border-trade-border rounded-lg px-3 py-2.5 text-white text-xs">
                      Market
                    </div>
                  </div>
                  <div>
                    <div className="text-trade-muted text-xs mb-1.5">Amount (USD)</div>
                    <div className="bg-trade-bg border border-trade-border rounded-lg px-3 py-2.5 text-white text-xs">
                      100.00
                    </div>
                  </div>
                  <div>
                    <div className="text-trade-muted text-xs mb-1.5">Leverage</div>
                    <div className="bg-trade-bg border border-trade-border rounded-lg px-3 py-2.5 text-brand text-xs font-medium">
                      20x
                    </div>
                  </div>
                </div>

                <div className="bg-bull text-white text-xs font-semibold text-center py-3 rounded-lg">
                  Place Buy Order
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. How It Works ── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-gray-500">Three steps to start trading.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="text-5xl font-bold text-brand mb-4">1</div>
              <h3 className="text-dark font-semibold text-lg mb-2">Create Account</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Sign up with your email in seconds. No KYC, no identity verification required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="text-5xl font-bold text-brand mb-4">2</div>
              <h3 className="text-dark font-semibold text-lg mb-2">Get $1,000 Virtual Funds</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your account is instantly funded with $1,000 in virtual capital to trade with.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="text-5xl font-bold text-brand mb-4">3</div>
              <h3 className="text-dark font-semibold text-lg mb-2">Start Trading</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Open leveraged positions on BTC, ETH, SOL, and more with real-time market data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ── */}
      <section className="bg-trade-bg py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Ready to Trade?
          </h2>
          <p className="text-trade-muted text-lg mb-10">
            Join Velox and start trading with $1,000 in virtual funds — completely free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto text-dark font-semibold text-sm bg-brand px-8 py-4 rounded-xl hover:brightness-110 transition-all shadow-[0_4px_24px_rgba(255,184,0,0.25)]"
            >
              Create Free Account
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto text-white font-semibold text-sm border border-trade-border px-8 py-4 rounded-xl hover:bg-trade-secondary transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-dark tracking-tight">velox</span>
          <p className="text-xs text-gray-400">
            Simulated trading platform. No real funds at risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
