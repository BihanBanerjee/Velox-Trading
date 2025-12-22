/**
 * Validate if leverage is within acceptable range
 * 
 * @param leverage Leverage value to validate
 * @returns true if valid
 */
export function isValidLeverage(leverage: number): boolean {
    return leverage >= 1 && leverage <= 100 && Number.isInteger(leverage);
}