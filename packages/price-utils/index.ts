/*
Price utility functions for precise financial calculations
Uses BigInt to avoid floating-point precision errors

Scale: 10^8 (100,000,000) - supports 8 decimal places
Example: 54820.50000000 -> 5482050000000n
*/

export const PRICE_SCALE = 100000000n; // 10^8 for 8 decimal places
export const PRICE_SCALE_NUMBER = 100000000; // Number version for calculations

// Convert decimal number to integer (multiply by scale)

export function toInteger(decimal: number): bigint {
    if (isNaN(decimal) || !isFinite(decimal)) {
        throw new Error(`Invalid decimal number: ${decimal}`);
    }

    // Round to avoid precision issues, then convert to BigInt
    const scaled = Math.round(decimal * PRICE_SCALE_NUMBER);
    return BigInt(scaled);
}

// Convert integer back to decimal number (divide by scale)
export function toDecimal(integer: bigint): number {
    return Number(integer) / PRICE_SCALE_NUMBER;
}

// Multiply two price integers with proper scaling
export function multiply(a: bigint, b: bigint): bigint {
    return (a * b) / PRICE_SCALE;
}

// Divide two price integers with proper scaling
export function divide(a: bigint, b: bigint): bigint {
    if(b === 0n) {
        throw new Error("Division by zero");
    }
    return (a * PRICE_SCALE) / b;
}

// Add two price integers
export function add(a: bigint, b:bigint): bigint {
    return a + b;
}

// Subtract two price integers
export function subtract(a: bigint, b: bigint): bigint {
    return a - b;
}

// Calculate position amount: quantity * price
// export function calculatePositionAmount(qtyInt: bigint, priceInt: bigint): bigint {
//     return multiply(qtyInt, priceInt);
// }

// Calculate margin: positionalAmount / leverage
// export function calculateMargin(positionalAmountInt: bigint, leverage: number): bigint {
//     const leverageInt = toInteger(leverage);
//     return divide(positionalAmountInt, leverageInt);
// }

// Calculate P&L for LONG position: (currentPrice - buyPrice) * quantity

export function calculateLongPnL(currentPriceInt: bigint, buyPriceInt: bigint, qtyInt: bigint): bigint {
    const priceDiff = subtract(currentPriceInt, buyPriceInt);
    return multiply(priceDiff, qtyInt);
}

// Calculate P&L for SHORT position: (buyPrice - currentPrice) * quantity
export function calculateShortPnL(buyPriceInt: bigint, currentPriceInt: bigint, qtyInt: bigint): bigint {
    const priceDiff = subtract(buyPriceInt, currentPriceInt);
    return multiply(priceDiff, qtyInt);
}

// Format Integer price for display (with specified decimal places)
export function formatPrice(priceInt: bigint, decimals: number = 8): string {
    const decimal = toDecimal(priceInt);
    return decimal.toFixed(decimals);
}
