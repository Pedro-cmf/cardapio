/**
 * Price Utilities
 *
 * Utilities for formatting, parsing and handling prices
 */

/**
 * Format a number as Brazilian Real currency
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 *
 * @example
 * formatPrice(1234.56) // "R$ 1.234,56"
 * formatPrice(0) // "R$ 0,00"
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Parse a price mask string to number
 * Removes all non-digit characters and converts to decimal
 *
 * @param value - The masked string (e.g., "1.234,56")
 * @returns Numeric value (e.g., 1234.56)
 *
 * @example
 * parsePriceMask("1.234,56") // 1234.56
 * parsePriceMask("R$ 10,00") // 10
 * parsePriceMask("") // 0
 */
export function parsePriceMask(value: string): number {
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D/g, '');
  // Converte para number (divide por 100 para adicionar centavos)
  return parseInt(digits || '0', 10) / 100;
}

/**
 * Format a number as Brazilian price mask (without currency symbol)
 *
 * @param value - The numeric value
 * @returns Formatted string (e.g., "1.234,56")
 *
 * @example
 * formatPriceMask(1234.56) // "1.234,56"
 * formatPriceMask(10) // "10,00"
 * formatPriceMask(0) // "0,00"
 */
export function formatPriceMask(value: number): string {
  // Formata como 1.234,56
  const intValue = Math.round(value * 100);
  const str = intValue.toString().padStart(3, '0');
  const len = str.length;
  const reais = str.substring(0, len - 2);
  const centavos = str.substring(len - 2);

  // Adiciona pontos de milhar
  const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${reaisFormatted},${centavos}`;
}

/**
 * Validate if a price is valid
 *
 * @param value - The price to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidPrice(10.50) // true
 * isValidPrice(-5) // false
 * isValidPrice(NaN) // false
 */
export function isValidPrice(value: number): boolean {
  return !isNaN(value) && isFinite(value) && value >= 0;
}
