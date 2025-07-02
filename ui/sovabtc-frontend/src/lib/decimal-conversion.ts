import { formatUnits, parseUnits } from 'viem'
import { SOVABTC_DECIMALS } from './constants'

/**
 * Convert token amount to SovaBTC amount based on decimal differences
 * Formula: sovaAmount = tokenAmount * 10^(8 - tokenDecimals)
 */
export function convertToSovaBTC(
  tokenAmount: bigint,
  tokenDecimals: number
): bigint {
  if (tokenDecimals === SOVABTC_DECIMALS) {
    return tokenAmount
  }
  
  const decimalDifference = SOVABTC_DECIMALS - tokenDecimals
  
  if (decimalDifference > 0) {
    // Need to scale up (multiply)
    return tokenAmount * (BigInt(10) ** BigInt(decimalDifference))
  } else {
    // Need to scale down (divide)
    return tokenAmount / (BigInt(10) ** BigInt(-decimalDifference))
  }
}

/**
 * Convert SovaBTC amount back to token amount
 * Formula: tokenAmount = sovaAmount * 10^(tokenDecimals - 8)
 */
export function convertFromSovaBTC(
  sovaAmount: bigint,
  tokenDecimals: number
): bigint {
  if (tokenDecimals === SOVABTC_DECIMALS) {
    return sovaAmount
  }
  
  const decimalDifference = tokenDecimals - SOVABTC_DECIMALS
  
  if (decimalDifference > 0) {
    // Need to scale up (multiply)
    return sovaAmount * (BigInt(10) ** BigInt(decimalDifference))
  } else {
    // Need to scale down (divide)
    return sovaAmount / (BigInt(10) ** BigInt(-decimalDifference))
  }
}

/**
 * Format token amount for display with proper decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxDecimals?: number
): string {
  const formatted = formatUnits(amount, decimals)
  
  if (maxDecimals !== undefined) {
    const parts = formatted.split('.')
    if (parts[1] && parts[1].length > maxDecimals) {
      return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`
    }
  }
  
  return formatted
}

/**
 * Parse user input string to token amount with proper decimals
 */
export function parseTokenAmount(
  input: string,
  decimals: number
): bigint {
  if (!input || input === '') {
    return BigInt(0)
  }
  
  try {
    return parseUnits(input, decimals)
  } catch {
    throw new Error(`Invalid amount: ${input}`)
  }
}

/**
 * Calculate conversion rate between two tokens
 */
export function calculateConversionRate(
  fromDecimals: number,
  toDecimals: number
): string {
  const rate = Math.pow(10, toDecimals - fromDecimals)
  return rate.toLocaleString()
}

/**
 * Format SovaBTC amount for display (always 8 decimals)
 */
export function formatSovaBTCAmount(
  amount: bigint,
  maxDecimals: number = 8
): string {
  return formatTokenAmount(amount, SOVABTC_DECIMALS, maxDecimals)
}

/**
 * Parse SovaBTC amount from user input
 */
export function parseSovaBTCAmount(input: string): bigint {
  return parseTokenAmount(input, SOVABTC_DECIMALS)
}

/**
 * Check if an amount is within precision limits for a token
 */
export function validateTokenPrecision(
  input: string,
  decimals: number
): boolean {
  const parts = input.split('.')
  if (parts.length === 1) return true // No decimal part
  
  return parts[1].length <= decimals
}

/**
 * Convert amount string to display with commas and proper formatting
 */
export function formatDisplayAmount(
  amount: string,
  maxDecimals: number = 6
): string {
  const num = parseFloat(amount)
  
  if (num === 0) return '0'
  if (num < 0.000001) return '< 0.000001'
  
  // Format with proper precision
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
  
  return formatted
}

/**
 * Get conversion preview text for UI display
 */
export function getConversionPreview(
  inputAmount: string,
  fromSymbol: string,
  fromDecimals: number,
  toSymbol: string = 'sovaBTC',
  toDecimals: number = SOVABTC_DECIMALS
): string {
  if (!inputAmount || inputAmount === '0') {
    return `0 ${toSymbol}`
  }
  
  try {
    const fromAmount = parseTokenAmount(inputAmount, fromDecimals)
    const toAmount = convertToSovaBTC(fromAmount, fromDecimals)
    const formatted = formatTokenAmount(toAmount, toDecimals, 8)
    
    return `${formatDisplayAmount(formatted)} ${toSymbol}`
  } catch {
    return `- ${toSymbol}`
  }
}

/**
 * Calculate minimum amount based on minimum satoshis
 */
export function getMinimumAmount(
  minSatoshis: number,
  tokenDecimals: number
): bigint {
  const minSovaBTC = BigInt(minSatoshis)
  return convertFromSovaBTC(minSovaBTC, tokenDecimals)
}

/**
 * Validate if amount meets minimum requirements
 */
export function validateMinimumAmount(
  amount: bigint,
  tokenDecimals: number,
  minSatoshis: number
): boolean {
  const sovaBTCAmount = convertToSovaBTC(amount, tokenDecimals)
  return sovaBTCAmount >= BigInt(minSatoshis)
}

/**
 * Get human-readable minimum amount for display
 */
export function getMinimumAmountDisplay(
  minSatoshis: number,
  tokenDecimals: number,
  tokenSymbol: string
): string {
  const minAmount = getMinimumAmount(minSatoshis, tokenDecimals)
  const formatted = formatTokenAmount(minAmount, tokenDecimals)
  return `${formatted} ${tokenSymbol}`
} 