import { type ReactNode, useEffect, useState } from 'react';
import { InteractionManager, View } from 'react-native';

// A tab's page that stays built once built (the owner's report, 26 Kasım: every tab switch built
// its page again, a few hundred ms, behind the switch's slide). The way Mekan's "Masalar | Akış"
// already worked (venue.tsx, 25 Kasım) and Telegram Android's pages: a switch only shows one page
// and hides the others; nothing is built again, and its arrival (Reveal) does not play again.

const HIDDEN = { display: 'none' } as const;

// The tabs built so far: the chosen one at once, the others once the screen has settled after its
// opening (InteractionManager), so even the first switch finds its page ready.
export function useBuiltTabs<T extends string>(tab: T, all: readonly T[]): ReadonlySet<T> {
  const [built, setBuilt] = useState<ReadonlySet<T>>(() => new Set([tab]));
  if (!built.has(tab)) setBuilt(new Set([...built, tab]));
  const key = all.join('|');
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() =>
      setBuilt((now) => (all.every((t) => now.has(t)) ? now : new Set([...now, ...all]))),
    );
    return () => task.cancel();
    // `all` is read through its key: a new array of the same tabs is the same tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return built;
}

// One tab's page: nothing until it is built, then shown or hidden.
export function TabPane({
  built,
  shown,
  grow,
  children,
}: {
  built: boolean;
  shown: boolean;
  // Filling the room it stands in (Mesajlar: the empty and loading states centre in it).
  grow?: boolean;
  children: ReactNode;
}) {
  if (!built) return null;
  return <View style={shown ? (grow ? GROW : undefined) : HIDDEN}>{children}</View>;
}
const GROW = { flexGrow: 1 } as const;
