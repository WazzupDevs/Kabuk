import type { Friend } from '@shared/api/friends.ts';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';

import { openDm } from './openDm';

// A friend's profile (aura v50, ProfilBaskasi): "Arkadaşsınız", a 50 green pill, beside "Mesaj" of
// the same width.
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
        <CapIcon name="check" color={c.friendPillInk} size={KIT.size.iconSm} />
        <T v="btn" color={c.friendPillInk}>
          {tr.profile.friendsStatus}
        </T>
      </View>
      {threadId ? (
        <Btn
          bar={KIT.size.btnRow}
          block
          icon="forward"
          label={tr.friends.messageShort}
          onPress={() => openDm({ threadId, publicId: friend.publicId, name: friend.displayName })}
          style={{ flex: 1, minWidth: 0 }}
        />
      ) : null}
    </View>
  );
}

const GAP = 10;
const PILL_GAP = 8;
