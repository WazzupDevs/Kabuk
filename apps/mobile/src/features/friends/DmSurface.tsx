import { useEffect } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { DmThread } from '../../../app/(app)/(tabs)/messages/[threadId]';
import { SlideOverLayer, slideIn, slideOut } from '@/motion/SlideOver';
import { DM } from '@/theme/dm';

import {
  type DmThreadRef,
  openDmSurface,
  settleDmSurface,
  shutDmSurface,
  useDmSurface,
  warmDm,
} from './dmSurfaceStore';
import { useDmInbox } from './queries';

// Opens a conversation on the surface: the slide starts on the tap's frame, on the UI thread; a
// conversation built ahead is only shown, another one is built as it slides (Telegram's chat
// opening, the owner's call, 25 Kasım).
export function showDm(thread: DmThreadRef): void {
  openDmSurface(thread);
  slideIn(DM.slide, settleDmSurface);
}

// Back to where it was opened from: the keyboard down, the slide out, then the surface empty. A
// conversation that ended (removed, blocked) is not kept.
export function hideDm(ended = false): void {
  Keyboard.dismiss();
  const gone = ended ? useDmSurface.getState().open?.threadId : undefined;
  useDmSurface.setState({ settled: false });
  slideOut(DM.slide, () => {
    shutDmSurface();
    if (gone) useDmSurface.setState((s) => ({ warm: s.warm.filter((t) => t.threadId !== gone) }));
  });
}

const closeFromEdge = () => hideDm(false);

// The surface over the tabs (the tab bar too): each conversation built ahead lies here at the
// screen's size, only the open one seen and touched. Shut, it is off the screen at the right and
// draws nothing.
export function DmSurface() {
  const open = useDmSurface((s) => s.open);
  const settled = useDmSurface((s) => s.settled);
  const warm = useDmSurface((s) => s.warm);
  useWarmInbox();
  useEffect(() => {
    useDmSurface.setState({ mounted: true });
    return () => useDmSurface.setState({ mounted: false, open: null, settled: false });
  }, []);
  return (
    <SlideOverLayer
      open={open !== null}
      timing={DM.slide}
      edge={{ width: DM.slide.edge, top: DM.slide.edgeTop, flick: DM.slide.flick }}
      onEdgeClose={closeFromEdge}
    >
      {warm.map((t) => {
        const on = open?.threadId === t.threadId;
        return (
          <View
            key={t.threadId}
            pointerEvents={on ? 'auto' : 'none'}
            accessibilityElementsHidden={!on}
            importantForAccessibility={on ? 'auto' : 'no-hide-descendants'}
            style={[StyleSheet.absoluteFill, { opacity: on ? 1 : 0, zIndex: on ? 1 : 0 }]}
          >
            <DmThread
              threadId={t.threadId}
              publicId={t.publicId}
              name={t.name}
              surface={{ visible: on, settled: on && settled, onClose: hideDm }}
            />
          </View>
        );
      })}
    </SlideOverLayer>
  );
}

// The inbox's first conversations built ahead once the launch is idle (the ones most likely
// opened next).
function useWarmInbox() {
  const inbox = useDmInbox();
  const first = (inbox.data ?? [])
    .filter((t) => !t.archived && t.threadId)
    .slice(0, DM.slide.warmAhead)
    .map((t) => `${t.threadId}|${t.publicId}|${t.displayName ?? ''}`)
    .join('\n');
  useEffect(() => {
    if (!first) return undefined;
    const timer = setTimeout(() => {
      for (const line of first.split('\n')) {
        const [threadId = '', publicId = '', name = ''] = line.split('|');
        if (threadId) warmDm({ threadId, publicId, name });
      }
    }, DM.slide.warmAfterMs);
    return () => clearTimeout(timer);
  }, [first]);
}
