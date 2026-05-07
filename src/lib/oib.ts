// Croatian OIB (Personal Identification Number) validator.
// 11 digits, mod-11-10 checksum (ISO 7064 / MOD 11,10).
// Optionally prefixed with "HR".

export function normaliseOib(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/[^0-9]/g, "");
}

export function isValidOib(input: string | null | undefined): boolean {
  const s = normaliseOib(input);
  if (s.length !== 11) return false;
  let remainder = 10;
  for (let i = 0; i < 10; i++) {
    remainder += parseInt(s[i], 10);
    remainder %= 10;
    if (remainder === 0) remainder = 10;
    remainder *= 2;
    remainder %= 11;
  }
  let check = 11 - remainder;
  if (check === 10) check = 0;
  return check === parseInt(s[10], 10);
}

export function formatOib(input: string): string {
  const s = normaliseOib(input);
  if (s.length !== 11) return input;
  return `HR${s}`;
}
