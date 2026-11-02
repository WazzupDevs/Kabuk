import type { Friend } from '@shared/api/friends.ts';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

import { openDm } from './openDm';

// A friend's profile (U31, ProfilBaskasi): "Arkadaşsınız", a 56 success-soft pill with checkCircle
// 20, beside "Mesaj" (primary, the chat icon, no arrow) of the same width, 12 apart.
export function FriendActions({ friend }: { friend: Friend }) {
  const { c } = useKit();
  const threadId = friend.threadId;
  return (
    <View style={{ flexDirection: 'row', gap: GAP }}>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: PILL_GAP,
          height: KIT.size.btnRow,
          borderRadius: KIT.size.btnRow / 2,
          backgroundColor: c.friendPill,
        }}
      >
        <CapIcon name="checkCircle" color={c.friendPillInk} size={ICON.md} />
        <T v="btn" color={c.friendPillInk}>
          {tr.profile.friendsStatus}
        </T>
      </View>
      {threadId ? (
        <Btn
          bar={KIT.size.btnRow}
          block
          icon="chat"
          label={tr.friends.messageShort}
          onPress={() => openDm({ threadId, publicId: friend.publicId, name: friend.displayName })}
          style={{ flex: 1, minWidth: 0 }}
        />
      ) : null}
    </View>
  );
}

const GAP = SPACING[3];
const PILL_GAP = 8;
