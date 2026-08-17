import { normalizePhone } from '../lib/phone';

describe('normalizePhone', () => {
  it('normalizes a US number with hyphens', () => {
    const result = normalizePhone('415-555-2671');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14155552671');
  });

  it('normalizes a US number with spaces and parentheses', () => {
    const result = normalizePhone('(415) 555 2671');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14155552671');
  });

  it('normalizes a number already in E.164 format', () => {
    const result = normalizePhone('+14155552671');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14155552671');
  });

  it('treats identically formatted numbers as equal after normalization', () => {
    const a = normalizePhone('+1 415 555 2671');
    const b = normalizePhone('14155552671');
    expect(a.valid).toBe(true);
    expect(b.valid).toBe(true);
    expect(a.normalized).toBe(b.normalized);
  });

  it('handles 00-prefixed international dialing format', () => {
    const result = normalizePhone('0044 20 7946 0958');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+442079460958');
  });

  it('rejects empty input', () => {
    const result = normalizePhone('');
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only input', () => {
    const result = normalizePhone('   ');
    expect(result.valid).toBe(false);
  });

  it('rejects non-string input', () => {
    const result = normalizePhone(undefined);
    expect(result.valid).toBe(false);
  });

  it('rejects letters', () => {
    const result = normalizePhone('call-me-maybe');
    expect(result.valid).toBe(false);
  });

  it('rejects numbers that are too short to be valid', () => {
    const result = normalizePhone('123');
    expect(result.valid).toBe(false);
  });
});
