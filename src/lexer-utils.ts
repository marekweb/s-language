export function isAlphaNumeric(code: number): boolean {
  return isAlpha(code) || isNumeric(code);
}

export function isNumeric(code: number): boolean {
  return code > 47 && code < 58;
}

export function isAlpha(code: number): boolean {
  return (code > 64 && code < 91) || (code > 96 && code < 123);
}

export function isWhitespace(code: number): boolean {
  return code === 32 || code === 13 || code === 9;
}
