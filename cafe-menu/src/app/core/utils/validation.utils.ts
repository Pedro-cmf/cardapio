/**
 * Validation Utilities
 *
 * Input validation functions to prevent security issues and ensure data integrity
 */

/**
 * Validate if a string is a valid URL
 *
 * @param url - The URL string to validate
 * @returns true if valid URL, false otherwise
 *
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("not a url") // false
 * isValidUrl("") // false
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid hex color
 *
 * @param color - The color string to validate
 * @returns true if valid hex color, false otherwise
 *
 * @example
 * isValidHexColor("#FF0000") // true
 * isValidHexColor("#F00") // true
 * isValidHexColor("red") // false
 * isValidHexColor("") // false
 */
export function isValidHexColor(color: string): boolean {
  if (!color || color.trim() === '') return false;

  // Hex color regex: # followed by 3 or 6 hex digits
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Validate if a string is a valid CSS color (hex, rgb, rgba, named)
 *
 * @param color - The color string to validate
 * @returns true if valid CSS color, false otherwise
 *
 * @example
 * isValidCssColor("#FF0000") // true
 * isValidCssColor("rgb(255, 0, 0)") // true
 * isValidCssColor("red") // true
 * isValidCssColor("invalid") // false
 */
export function isValidCssColor(color: string): boolean {
  if (!color || color.trim() === '') return false;

  // Try to apply color to a test element
  const testElement = document.createElement('div');
  testElement.style.color = color;

  // If color was applied, it's valid
  return testElement.style.color !== '';
}

/**
 * Sanitize string input to prevent XSS
 * Removes HTML tags and dangerous characters
 *
 * @param input - The input string to sanitize
 * @returns Sanitized string
 *
 * @example
 * sanitizeInput("<script>alert('xss')</script>") // "scriptalert('xss')/script"
 * sanitizeInput("Normal text") // "Normal text"
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Validate email format
 *
 * @param email - The email string to validate
 * @returns true if valid email, false otherwise
 *
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate slug format (URL-friendly string)
 *
 * @param slug - The slug string to validate
 * @returns true if valid slug, false otherwise
 *
 * @example
 * isValidSlug("my-cafe-123") // true
 * isValidSlug("My Café!") // false
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim() === '') return false;

  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validate if string length is within limits
 *
 * @param value - The string to validate
 * @param min - Minimum length (inclusive)
 * @param max - Maximum length (inclusive)
 * @returns true if length is valid, false otherwise
 *
 * @example
 * isValidLength("Hello", 1, 10) // true
 * isValidLength("", 1, 10) // false
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  if (!value) return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate if a number is within a range
 *
 * @param value - The number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if within range, false otherwise
 *
 * @example
 * isInRange(5, 1, 10) // true
 * isInRange(15, 1, 10) // false
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return !isNaN(value) && isFinite(value) && value >= min && value <= max;
}
