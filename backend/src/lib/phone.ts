import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

const DEFAULT_COUNTRY = (process.env.DEFAULT_COUNTRY_CODE || 'US') as CountryCode;

export interface NormalizeResult {
  valid: boolean;
  /** E.164 format, e.g. +14155552671. Only set when valid. */
  normalized?: string;
  reason?: string;
}

/**
 * Normalizes a user-supplied phone number to E.164 (e.g. "+14155552671").
 * Handles spaces, hyphens, parentheses, dots, and both "+1" and "001" style
 * country-code prefixes. Numbers with no country code fall back to
 * DEFAULT_COUNTRY_CODE (defaults to "US").
 */
export function normalizePhone(input: unknown): NormalizeResult {
  if (typeof input !== 'string') {
    return { valid: false, reason: 'Phone number must be a string.' };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Phone number is required.' };
  }

  // Reject anything containing letters or other non phone-ish characters up front
  // so we give a clear error instead of a confusing "invalid number" from the parser.
  if (!/^[0-9+\-\s().]+$/.test(trimmed)) {
    return { valid: false, reason: 'Phone number contains invalid characters.' };
  }

  const candidate = trimmed.replace(/^00/, '+');

  const phoneNumber = parsePhoneNumberFromString(candidate, DEFAULT_COUNTRY);

  if (!phoneNumber || !phoneNumber.isValid()) {
    return { valid: false, reason: 'Phone number is not a valid phone number.' };
  }

  return { valid: true, normalized: phoneNumber.number };
}
