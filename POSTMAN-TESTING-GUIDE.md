# API Testing Guide - Postman

**Base URL:** `http://localhost:3005`

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Order Endpoints](#order-endpoints)
3. [LONG Order Examples](#long-order-examples)
4. [SHORT Order Examples](#short-order-examples)
5. [Testing Workflow](#testing-workflow)

---

## Authentication Endpoints

### 1. Sign Up
- **Method:** `POST`
- **Route:** `/api/v1/user/signup`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "user@example.com",
  "phone": 1234567890,
  "password": "password123"
}
```
- **Notes:**
  - Email must be valid format
  - Phone must be a positive integer
  - Password must be 6-100 characters
  - Creates user with initial balance of 1000.00 USD
  - Sets authentication cookie automatically

---

### 2. Sign In
- **Method:** `POST`
- **Route:** `/api/v1/user/signin`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Notes:** Sets authentication cookie automatically

---

### 3. Sign Out
- **Method:** `POST`
- **Route:** `/api/v1/user/signout`
- **Headers:** None required
- **Body:** None
- **Notes:** Clears authentication cookie

---

## Order Endpoints

**⚠️ All order endpoints require authentication (cookie from signin/signup)**

### 1. Open Order
- **Method:** `POST`
- **Route:** `/api/v1/order/open`
- **Headers:** `Content-Type: application/json`
- **Authentication:** Cookie (set from signin/signup)
- **Body Parameters:**
  - `orderType`: `"LONG"` or `"SHORT"` (required)
  - `asset`: `"BTCUSDT"`, `"ETHUSDT"`, or `"SOLUSDT"` (required)
  - `leverage`: Integer between 1-100 (required)
  - `qty`: Positive number (required)
  - `stopLoss`: Positive number (optional)
  - `takeProfit`: Positive number (optional)

---

### 2. Close Order
- **Method:** `POST`
- **Route:** `/api/v1/order/close/:orderId`
- **Headers:** `Content-Type: application/json`
- **Authentication:** Cookie
- **Route Params:**
  - `orderId`: Custom format (e.g., `ord_1735567890123_abc123d`)
- **Body:** None
- **Example:** `/api/v1/order/close/ord_1735567890123_abc123d`

---

### 3. Get Single Order
- **Method:** `GET`
- **Route:** `/api/v1/order/:orderId`
- **Authentication:** Cookie
- **Route Params:**
  - `orderId`: Custom format
- **Body:** None
- **Example:** `/api/v1/order/ord_1735567890123_abc123d`

---

### 4. Get User Orders
- **Method:** `GET`
- **Route:** `/api/v1/order/user/orders`
- **Authentication:** Cookie
- **Query Params (optional):**
  - `status`: `"OPEN"`, `"CLOSED"`, or `"LIQUIDATED"`
- **Body:** None
- **Examples:**
  - All orders: `/api/v1/order/user/orders`
  - Open orders: `/api/v1/order/user/orders?status=OPEN`
  - Closed orders: `/api/v1/order/user/orders?status=CLOSED`

---

### 5. Get User Balance
- **Method:** `GET`
- **Route:** `/api/v1/order/user/balance`
- **Authentication:** Cookie
- **Query Params:** None
- **Body:** None

---

## LONG Order Examples

### Example 1: Basic LONG Order (BTC)
```json
{
  "orderType": "LONG",
  "asset": "BTCUSDT",
  "leverage": 10,
  "qty": 0.001
}
```

### Example 2: LONG with Stop Loss (ETH)
```json
{
  "orderType": "LONG",
  "asset": "ETHUSDT",
  "leverage": 5,
  "qty": 0.01,
  "stopLoss": 3400
}
```
*Stop loss triggers if price goes DOWN to 3400*

### Example 3: LONG with Take Profit (SOL)
```json
{
  "orderType": "LONG",
  "asset": "SOLUSDT",
  "leverage": 15,
  "qty": 1,
  "takeProfit": 220
}
```
*Take profit triggers if price goes UP to 220*

### Example 4: LONG with Both Stop Loss & Take Profit (BTC)
```json
{
  "orderType": "LONG",
  "asset": "BTCUSDT",
  "leverage": 20,
  "qty": 0.005,
  "stopLoss": 95000,
  "takeProfit": 105000
}
```
*For LONG orders:*
- *Stop Loss (95000) should be BELOW current price*
- *Take Profit (105000) should be ABOVE current price*

---

## SHORT Order Examples

### Example 1: Basic SHORT Order (BTC)
```json
{
  "orderType": "SHORT",
  "asset": "BTCUSDT",
  "leverage": 5,
  "qty": 0.001
}
```

### Example 2: SHORT with Stop Loss (ETH)
```json
{
  "orderType": "SHORT",
  "asset": "ETHUSDT",
  "leverage": 10,
  "qty": 0.01,
  "stopLoss": 3800
}
```
*Stop loss triggers if price goes UP to 3800*

### Example 3: SHORT with Take Profit (SOL)
```json
{
  "orderType": "SHORT",
  "asset": "SOLUSDT",
  "leverage": 20,
  "qty": 1,
  "takeProfit": 180
}
```
*Take profit triggers if price goes DOWN to 180*

### Example 4: SHORT with Both Stop Loss & Take Profit (BTC)
```json
{
  "orderType": "SHORT",
  "asset": "BTCUSDT",
  "leverage": 15,
  "qty": 0.005,
  "stopLoss": 105000,
  "takeProfit": 92000
}
```
*For SHORT orders:*
- *Stop Loss (105000) should be ABOVE current price*
- *Take Profit (92000) should be BELOW current price*

### Example 5: High Leverage SHORT (ETH)
```json
{
  "orderType": "SHORT",
  "asset": "ETHUSDT",
  "leverage": 50,
  "qty": 0.1,
  "stopLoss": 3700,
  "takeProfit": 3300
}
```

### Example 6: Conservative SHORT (BTC)
```json
{
  "orderType": "SHORT",
  "asset": "BTCUSDT",
  "leverage": 2,
  "qty": 0.01,
  "stopLoss": 101000,
  "takeProfit": 95000
}
```

### Example 7: Medium Risk SHORT (ETH)
```json
{
  "orderType": "SHORT",
  "asset": "ETHUSDT",
  "leverage": 25,
  "qty": 0.05,
  "stopLoss": 3650,
  "takeProfit": 3450
}
```

### Example 8: Scalping SHORT (SOL)
```json
{
  "orderType": "SHORT",
  "asset": "SOLUSDT",
  "leverage": 30,
  "qty": 2,
  "stopLoss": 202,
  "takeProfit": 198
}
```

---

## Understanding Order Types

### LONG Orders 📈
- **Profit:** When price goes UP
- **Loss:** When price goes DOWN
- **Stop Loss:** Should be BELOW entry price (limits downside)
- **Take Profit:** Should be ABOVE entry price (captures upside)

**Example:**
- Entry: $100,000 BTC
- Price rises to $105,000 → **Profit** ✅
- Price falls to $95,000 → **Loss** ❌

### SHORT Orders 📉
- **Profit:** When price goes DOWN
- **Loss:** When price goes UP
- **Stop Loss:** Should be ABOVE entry price (limits upside risk)
- **Take Profit:** Should be BELOW entry price (captures downside gain)

**Example:**
- Entry: $100,000 BTC (SHORT)
- Price falls to $95,000 → **Profit** ✅
- Price rises to $105,000 → **Loss** ❌

---

## Testing Workflow

### Recommended Testing Order:

1. **Sign Up** → Creates user and sets cookie
   ```
   POST /api/v1/user/signup
   ```

2. **Sign In** → Verifies login works
   ```
   POST /api/v1/user/signin
   ```

3. **Get Balance** → Check initial 1000.00 USD
   ```
   GET /api/v1/order/user/balance
   ```

4. **Open LONG Order** → Create a position
   ```
   POST /api/v1/order/open
   ```

5. **Get User Orders** → Verify order appears
   ```
   GET /api/v1/order/user/orders?status=OPEN
   ```

6. **Get Single Order** → Fetch specific order details
   ```
   GET /api/v1/order/:orderId
   ```

7. **Open SHORT Order** → Create opposite position
   ```
   POST /api/v1/order/open
   ```

8. **Get All Orders** → See both LONG and SHORT
   ```
   GET /api/v1/order/user/orders
   ```

9. **Close Orders** → Close positions one by one
   ```
   POST /api/v1/order/close/:orderId
   ```

10. **Check Final Balance** → See P&L reflected
    ```
    GET /api/v1/order/user/balance
    ```

11. **Sign Out** → Clean session
    ```
    POST /api/v1/user/signout
    ```

---

## Important Notes

### Cookie Management
- Enable "Automatically follow redirects" in Postman settings
- Cookies are set automatically after signup/signin
- All subsequent requests will include the cookie

### Order IDs
- Format: `ord_<timestamp>_<random>` (e.g., `ord_1735567890123_abc123d`)
- Save the `orderId` from "Open Order" response
- Use it for "Close Order" and "Get Single Order"

### Required Services
Make sure these are running:
- ✅ HTTP Backend (port 3005)
- ✅ Liquidation Engine
- ✅ Price Poller
- ✅ Redis (for order processing)

Start all services:
```bash
bun run start-services.ts
```

### Error Handling
Common errors:
- `401 Unauthorized` → Not logged in (signin first)
- `400 Bad Request` → Invalid input (check validation)
- `404 Not Found` → Order doesn't exist
- `500 Internal Server Error` → Service issue (check logs)

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Sign Up | POST | `/api/v1/user/signup` |
| Sign In | POST | `/api/v1/user/signin` |
| Sign Out | POST | `/api/v1/user/signout` |
| Open Order | POST | `/api/v1/order/open` |
| Close Order | POST | `/api/v1/order/close/:orderId` |
| Get Order | GET | `/api/v1/order/:orderId` |
| Get User Orders | GET | `/api/v1/order/user/orders` |
| Get Balance | GET | `/api/v1/order/user/balance` |

---

Happy Testing! 🚀
