import type { ReactNode } from 'react';

// Capitals the Turkish way: "i" → "İ", "ı" → "I". The platform's textTransform: 'uppercase' uses
// the device locale's rules, so Android writes KATEGORI, KELIMELER, BITTI. Text runs its strings
// and numbers through this when the type variant is in capitals (overline); other children (a nested
// Text) keep their own case.
export function upperTr(node: ReactNode): ReactNode {
  if (typeof node === 'string') return node.toLocaleUpperCase('tr-TR');
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((child: ReactNode) => upperTr(child));
  return node;
}
