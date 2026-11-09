import { useState } from 'react';

// A photo is signed anew on many reads (a new token in its address, an hour long; each Edge
// Function instance keeps its own). The phone keeps the first address of a photo while it is still
// good: refreshing a screen or opening a chat does not download and draw the same photo again (it
// went blank for a moment; the owner's report, 27 Ekim).
const KEEP_MS = 45 * 60 * 1000;
// At most this many photos are kept (the oldest kept goes first): a long session of venue chats
// and lobbies would otherwise keep every address it ever saw.
const KEEP_MAX = 400;
const kept = new Map<string, { url: string; at: number }>();

// The photo's path, its address without the signature: the same photo, whatever its signature.
export function photoCacheKey(url: string): string {
  return url.split('?')[0] ?? url;
}

function stablePhotoUrl(url: string, now: number = Date.now()): string {
  const key = url.split('?')[0] ?? url;
  const hit = kept.get(key);
  if (hit && now - hit.at < KEEP_MS) return hit.url;
  kept.delete(key);
  kept.set(key, { url, at: now });
  // A Map iterates in insertion order: the first ones are the oldest kept.
  for (const [old, entry] of kept) {
    if (kept.size <= KEEP_MAX && now - entry.at < KEEP_MS) break;
    kept.delete(old);
  }
  return url;
}

// A photo's address to draw, null once it failed to load (the initials or the default face then).
export function usePhoto(url: string | null | undefined): {
  url: string | null;
  onError: () => void;
} {
  const [failed, setFailed] = useState<string | null>(null);
  const stable = url ? stablePhotoUrl(url) : null;
  return {
    url: stable && stable !== failed ? stable : null,
    onError: () => {
      if (stable) kept.delete(stable.split('?')[0] ?? stable);
      setFailed(stable);
    },
  };
}
