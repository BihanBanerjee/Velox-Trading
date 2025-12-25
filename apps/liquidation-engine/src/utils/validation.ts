/**
 * Order validation utilities
 * Business rules for validating order parameters
 */

/**
 * Validate that a price is positive
 */
export function isValidPrice(priceInt: bigint): boolean {
  return priceInt > 0n;
}

/**
 * Validate that a quantity is positive
 */
export function isValidQuantity(qtyInt: bigint): boolean {
  return qtyInt > 0n;
}

/**
 * Validate leverage is within acceptable trading range (1-100)
 */
export function isValidLeverage(leverage: number): boolean {
  return leverage >= 1 && leverage <= 100 && Number.isInteger(leverage);
}
