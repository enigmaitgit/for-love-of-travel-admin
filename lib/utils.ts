import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Deep cleans an object by removing empty strings, null, undefined, and "undefined" values.
 * Also removes empty arrays and objects.
 *
 * @param obj - The object to clean.
 * @returns A cleaned version of the object.
 */
export function deepClean<T>(obj: T): T {
  const isPlain = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v);

  const clean = (v: unknown): unknown => {
    if (Array.isArray(v)) {
      const arr = v.map(clean).filter(x => x !== undefined);
      return arr.length ? arr : undefined;
    }
    if (isPlain(v)) {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        const c = clean(val);
        if (c !== undefined) out[k] = c;
      }
      return Object.keys(out).length ? out : undefined;
    }
    if (v === '' || v === null || v === undefined || v === 'undefined') return undefined;
    return v;
  };

  return (clean(obj) ?? {}) as T;
}
