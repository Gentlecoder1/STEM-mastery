const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function emailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function passwordError(value: string): string | null {
  if (!value) return 'Password is required.';
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return null;
}
