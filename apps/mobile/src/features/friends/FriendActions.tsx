import type { Friend } from '@shared/api/friends.ts';
import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, T, useKit } from '@/aura/kit';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { ICON, SPACING } from '@/theme/tokens';

import { openDm } from './openDm';

// A friend's profile (U31, ProfilBaskasi): "Arkadaşsınız", a success-soft pill with checkCircle 20,
// beside "Mesaj" (primary, the chat icon, no arrow) of the same width, 12 apart. With `onRemove`
// (the friend's profile) the pill is the button "Arkadaşlıktan çıkar" instead, opening the confirmed
// removal (rule 5; the owner's call, 2 Kasım, 17.1: the pill looked pressable and did nothing).
export function FriendActions({ friend, onRemove }: { friend: Friend; onRemove?: () => void }) {
  const { c } = useKit();
  const threadId = friend.threadId;
  return (
    <View style={{ flexDirection: 'row', gap: GAP }}>
      {onRemove ? (
        // As wide as its words; "Mesaj" takes the rest (Aura v76 ProfilBaskasi, F1: at an equal half
        // the words did not fit at 390 dp).
        <Btn
          bar={KIT.size.btnRow}
          snug
          variant="glassy"
          icon="personRemove"
          testID="profile-remove-button"
          label={tr.friends.removeFriend}
          onPress={onRemove}
          style={{ flexShrink: 0 }}
        />
      ) : (
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
      )}
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
