import { useState } from 'react';

// A profile photo that cannot be loaded (a bad or expired address, no connection) gives way to the
// initials on the violet, as without a photo, never an empty circle (canvas: Faz 2 · 22.5 → Yedek
// avatar). A new address, or the screen opened again, tries the photo again.
export function usePhoto(url: string | null | undefined): {
  url: string | null;
  onError: () => void;
} {
  const [failed, setFailed] = useState<string | null>(null);
  return {
    url: url && url !== failed ? url : null,
    onError: () => setFailed(url ?? null),
  };
}
