import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';

import type { RequesterStatus } from '@shared/rooms.ts';

import { type HapticCall, type HapticMoment, HAPTICS, requesterHaptic } from './hapticMoments';

const NOTIFICATION = {
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
} as const;
const IMPACT = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
} as const;

function play(call: HapticCall): Promise<void> {
  switch (call.kind) {
    case 'selection':
      return Haptics.selectionAsync();
    case 'notification':
      return Haptics.notificationAsync(NOTIFICATION[call.type]);
    case 'impact':
      return Haptics.impactAsync(IMPACT[call.style]);
  }
}

// The one way the app makes a touch (hapticMoments.ts says when). A device without haptics, or a
// failure, is silent.
export function haptic(moment: HapticMoment | null): void {
  if (!moment) return;
  void play(HAPTICS[moment]).catch(() => undefined);
}

// The requester's join request: a touch when it is accepted, none for a decline or a timeout.
export function useRequesterHaptic(requestId: string | undefined, status: RequesterStatus | null) {
  const last = useRef<{ id: string | undefined; status: RequesterStatus | null }>({
    id: requestId,
    status,
  });
  useEffect(() => {
    const previous = last.current.id === requestId ? last.current.status : null;
    last.current = { id: requestId, status };
    haptic(requesterHaptic(previous, status));
  }, [requestId, status]);
}
