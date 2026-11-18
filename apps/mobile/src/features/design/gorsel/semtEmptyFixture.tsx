import { DM_MAX_LENGTH } from '@shared/friends.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { ChatEmptyCard, ChatSuggestions } from '@/components/ChatEmptyCard';
import { ChatScreen, type ChatListItem } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { IdentityToggle } from '@/components/IdentityToggle';
import { ChatOptionsMenu } from '@/features/chat/ChatOptionsMenu';
import { TimeChip } from '@/features/district/parts';
import { DISTRICT_MUTES_KEY } from '@/features/district/RoomSheets';
import { profileViewKeys } from '@/features/profile/queries';
import { tr } from '@/i18n/tr';
import { CHAT_LOOK } from '@/theme/chatLook';
import { DM } from '@/theme/dm';

// The semt room with nobody's message yet, for the visual gate's `ekran/semt/bos` (yeni arayüz
// tuvali, SemtSohbet, pano 14): the route's bar (app/(app)/district/room.tsx: the identity toggle
// on Anonim, ⋮, the time chip) and its first message's card and suggestions, as the route lays
// them out, over the room's wall; no server (an own query client: the own profile without a
// photo, an empty muted list).
const NAME = 'Beylikdüzü';
const PUBLIC_ID = 'gorsel';
const BENCH_ART = require('../../../../assets/riso/semt/chat-bos.webp') as number;
// The picture's own 419 x 320 (as the route's).
const BENCH_RATIO = 320 / 419;

export function SemtEmptyFixture() {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(DISTRICT_MUTES_KEY, { mutes: [] });
    c.setQueryData(['profile', undefined], { public_id: PUBLIC_ID });
    // The board's profile slot: no photo, its initial G.
    c.setQueryData(profileViewKeys.view(PUBLIC_ID), {
      publicId: PUBLIC_ID,
      displayName: 'G',
      bio: null,
      photoUrl: null,
      coverUrl: null,
      badges: [],
      age: null,
      capsuleLook: 'c:nane e:koyu',
    });
    return c;
  });
  const noop = () => undefined;
  return (
    <QueryClientProvider client={client}>
      <ChatScreen<ChatListItem>
        wall="semt"
        startAtEnd
        list={{ items: [], renderItem: () => <View />, empty: <FirstHere /> }}
        top={
          <View style={{ gap: CHAT_LOOK.timeChip.top }}>
            <ChatTopBar
              dm
              onBack={noop}
              title={tr.district.room.title(NAME)}
              titleLines={1}
              toggle={
                <IdentityToggle
                  mode="anonymous"
                  locked={false}
                  size={CHAT_LOOK.toggle}
                  onPick={noop}
                  onLocked={noop}
                />
              }
              more={
                <ChatOptionsMenu
                  label={tr.district.room.options}
                  testID="district-chat-options"
                  onPeople={noop}
                  onLeave={noop}
                />
              }
            />
            <View style={{ alignItems: 'center' }}>
              <TimeChip
                chat
                text={tr.district.leftAmount(2, 1)}
                note={tr.district.leftWord}
                label={tr.district.leftLabel(2, 1)}
              />
            </View>
          </View>
        }
        composer={
          <Composer
            sendLabel={tr.venueChat.send}
            placeholder={tr.district.room.placeholder(NAME)}
            value=""
            onChangeText={noop}
            maxLength={DM_MAX_LENGTH}
            sendDisabled
            onSend={noop}
          />
        }
      />
    </QueryClientProvider>
  );
}

// The route's FirstHere (not exported there): the card in the middle of the stream, 40 from the
// sides, the three suggestions over the message bar.
function FirstHere() {
  return (
    <View className="flex-1" testID="district-chat-empty">
      <View
        className="flex-1 justify-center"
        style={{ paddingHorizontal: CHAT_LOOK.empty.side - DM.side }}
      >
        <ChatEmptyCard
          source={BENCH_ART}
          ratio={BENCH_RATIO}
          title={tr.district.room.emptyTitle}
          body={tr.district.room.emptyBody}
          label={tr.district.room.emptyLabel}
        />
      </View>
      <ChatSuggestions
        items={tr.district.room.suggest(NAME)}
        label={tr.chat.suggestLabel}
        onSend={() => undefined}
      />
    </View>
  );
}
