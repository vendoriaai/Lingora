// cn — className combiner. clsx for conditional/variant handling; the
// tailwind-merge step is intentionally omitted in Phase 0 (component classes
// are full overrides, not partial merges), to avoid pulling an extra dep.
// Phase 1+ may add tailwind-merge if shared/ui consumers need override merging.
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
