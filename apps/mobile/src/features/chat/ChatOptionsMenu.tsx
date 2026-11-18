import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Round } from '@/aura/kit';
import { type MenuAnchor, measureMenuAnchor, Menu, MenuItem } from '@/components/Menu';
import { tr } from '@/i18n/tr';
import { venueChatApi } from '@/lib/api';
import { KIT } from '@/theme/auraKit';
import { ICON } from '@/theme/tokens';

// The venue chat's muted list, one for the venue and the semt chat (§4.V).
export const CHAT_MUTES_KEY = ['venueChatMutes'] as const;

// The group chats' ⋮ (yeni arayüz tuvali, SemtSecenek, MekanSohbetSecenek): the soft 44 round
// outside the top bar's capsule, and the menu grown out of it (292 wide, 28 round, 8 inside; a tap
// outside or back closes it, one open at a time with the sheets and the dialog). Its rows: the
// room's people (semt), the muted ones (the settings' Sessize alınanlar; off with "Kimse yok" when
// there are none), the chat's rules, and leaving the chat (semt), red at the foot. No counts of
// who is there (rules 4 and 9).
export function ChatOptionsMenu({
  label,
  testID,
  onPeople,
  onLeave,
  peopleTestID,
  leaveTestID,
}: {
  label: string;
  testID: string;
  onPeople?: () => void;
  onLeave?: () => void;
  peopleTestID?: string;
  leaveTestID?: string;
}) {
  const ref = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [open, setOpen] = useState(false);
  const mutes = useQuery({
    queryKey: CHAT_MUTES_KEY,
    queryFn: () => venueChatApi.mutes(),
    enabled: open,
  });
  const count = mutes.data?.mutes.length;
  return (
    <>
      <View ref={ref} collapsable={false}>
        <Round
          side={KIT.size.round}
          icon="moreV"
          iconSize={ICON.md}
          label={label}
          testID={testID}
          onPress={() =>
            measureMenuAnchor(ref.current, (at) => {
              setAnchor(at);
              setOpen(true);
            })
          }
        />
      </View>
      {anchor ? (
        <Menu anchor={anchor} tight visible={open} onClose={() => setOpen(false)}>
          {onPeople ? (
            <MenuItem
              cap="people"
              label={tr.district.people.entry}
              testID={peopleTestID}
              onPress={onPeople}
            />
          ) : null}
          <MenuItem
            cap="mute"
            label={tr.venueChat.mutedTitle}
            testID="chat-muted-open"
            disabled={count === 0}
            value={count === 0 ? tr.venueChat.mutedNoneShort : undefined}
            onPress={() => router.push('/settings-muted')}
          />
          <MenuItem
            cap="info"
            label={tr.chatRules.title}
            testID="chat-rules-open"
            onPress={() => router.push('/chat-rules')}
          />
          {onLeave ? (
            <MenuItem
              cap="logout"
              negative
              label={tr.district.end.action}
              testID={leaveTestID}
              onPress={onLeave}
            />
          ) : null}
        </Menu>
      ) : null}
    </>
  );
}
