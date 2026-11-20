import type { Friend } from '@shared/api/friends.ts';

import { Btn } from '@/aura/kit';
import { openDm } from '@/features/friends/openDm';
import { tr } from '@/i18n/tr';
import { PERSON } from '@/theme/person';
import { useTheme } from '@/theme/ThemeProvider';

const B = PERSON;
// The buttons' words 600 16/20 (`.btn`), 12 inside at either side, each as wide as the other.
const LOOK = { type: 'btn', padLeft: B.actPad, padRight: B.actPad, icon: B.actIcon } as const;

// A friend's profile (ProfilBaskasi): "Mesaj" (the primary, the chat icon) and "Arkadaşsınız" (the
// soft green, a check in a circle) side by side, 12 apart, the same width. "Arkadaşsınız" is a
// status, not a button: it does nothing ("Arkadaşlıktan çıkar" is in the ⋮ menu). Without a
// conversation yet the status stands alone.
export function FriendActions({ friend }: { friend: Friend }) {
  const { scheme } = useTheme();
  const k = B[scheme].friend;
  const threadId = friend.threadId;
  return (
    <>
      {threadId ? (
        <Btn
          block
          icon="chat"
          testID="profile-message"
          label={tr.friends.messageShort}
          look={LOOK}
          style={{ flex: 1, minWidth: 0 }}
          onPress={() => openDm({ threadId, publicId: friend.publicId, name: friend.displayName })}
        />
      ) : null}
      <Btn
        block
        icon="checkCircle"
        testID="profile-friend-status"
        label={tr.profile.friendsStatus}
        fill={k.bg}
        tint={k.fg}
        look={LOOK}
        style={{ flex: 1, minWidth: 0 }}
      />
    </>
  );
}

// A stranger's profile from a message or a post (MekanProfil): the one wide button, "Arkadaşlık
// isteği gönder".
export function RequestAction({
  onPress,
  testID,
  loading,
}: {
  onPress: () => void;
  testID?: string;
  loading?: boolean;
}) {
  return (
    <Btn
      block
      icon="invite"
      testID={testID}
      label={tr.venueChat.sendRequest}
      look={LOOK}
      loading={loading}
      style={{ flex: 1, minWidth: 0 }}
      onPress={onPress}
    />
  );
}
