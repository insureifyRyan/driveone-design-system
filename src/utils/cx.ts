type ClassValue = string | number | boolean | null | undefined;

/** Join class names, dropping anything falsy or non-string. Internal helper. */
export function cx(...parts: ClassValue[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
