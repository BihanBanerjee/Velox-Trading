# React Optimization Plan: TradePage Component Splitting

## Problem

The entire `TradePage` component (`apps/web/app/trade/page.tsx`) is monolithic. Every WebSocket price tick updates `prices` state, which triggers a full re-render of the entire page — including the chart, order form, and closed orders table, none of which need to update on every tick.

## Current Re-render Triggers

| State Variable | Update Frequency | What Actually Needs It |
|---|---|---|
| `prices` | Every ~100ms (WS tick) | Price sidebar, top bar (equity), open positions (live P/L) |
| `orders` | On open/close | Open positions table |
| `closedOrders` | On close/tab switch | Closed positions table |
| `orderForm` fields | On user input | Order form only |
| `activeTab` | On tab click | Tab content area |
| `selectedAsset` | On asset click | Price sidebar highlight, chart, order form |

## Proposed Component Split

Split `TradePage` into 6 child components:

### 1. `PriceSidebar`
- **Props**: `prices`, `selectedAsset`, `onSelectAsset`
- **Memo**: No (needs `prices` which changes every tick)
- **Benefit**: Isolates asset selection logic

### 2. `ChartArea`
- **Props**: `selectedAsset`
- **Memo**: Yes (`React.memo`) — only re-renders when `selectedAsset` changes
- **Key insight**: Chart uses refs (`chartRef`, `seriesRef`) for updates, not state. The WebSocket `onmessage` callback updates the chart via refs, so it doesn't need React re-renders at all.
- **Benefit**: Eliminates ~90% of unnecessary re-renders for the heaviest DOM element

### 3. `OrderForm`
- **Props**: `selectedAsset`, `currentPrice`, `onSubmitOrder`
- **Memo**: Yes — only re-renders when `selectedAsset` or `currentPrice` changes
- **Key insight**: All form state (`orderType`, `leverage`, `volume`, `stopLoss`, `takeProfit`) is local to this component
- **Benefit**: Form inputs won't re-render on every price tick (pass price as a separate stable value)

### 4. `TopBar`
- **Props**: `balance`, `equity` (computed from prices + orders)
- **Memo**: No (equity changes with prices)
- **Benefit**: Isolates balance/equity display

### 5. `OpenPositions`
- **Props**: `orders`, `prices`, `onCloseOrder`
- **Memo**: No (needs `prices` for live P/L calculation)
- **Benefit**: Isolates order management logic

### 6. `ClosedPositions`
- **Props**: `closedOrders`
- **Memo**: Yes — only re-renders when `closedOrders` array changes
- **Benefit**: Static historical data, no reason to re-render on price ticks

## Implementation Steps

1. Create `apps/web/app/trade/components/` directory
2. Extract each component into its own file
3. Keep shared types/interfaces in a `types.ts` file
4. Move WebSocket connection and price state to `TradePage` (parent)
5. Pass chart WebSocket setup to `ChartArea` via a ref callback or effect
6. Wrap appropriate components with `React.memo`
7. Use `useCallback` for handler props (`onCloseOrder`, `onSubmitOrder`, `onSelectAsset`) to maintain stable references

## Expected Impact

| Component | Current renders/sec | After optimization |
|---|---|---|
| ChartArea | ~10 (every tick) | ~0 (only on asset change) |
| OrderForm | ~10 (every tick) | ~0 (only on asset change) |
| ClosedPositions | ~10 (every tick) | ~0 (only on close event) |
| PriceSidebar | ~10 | ~10 (still needs prices) |
| OpenPositions | ~10 | ~10 (still needs prices for P/L) |
| TopBar | ~10 | ~10 (still needs equity) |

**Net result**: 3 out of 6 components stop re-rendering on price ticks, reducing React reconciliation work by ~50%.

## Advanced Optimization (Future)

- **`useSyncExternalStore`**: Subscribe price sidebar and open positions directly to a price store outside React state, avoiding even the parent re-render
- **Virtual scrolling**: For open/closed positions tables if order count grows large
- **Web Workers**: Move P/L calculations off the main thread
