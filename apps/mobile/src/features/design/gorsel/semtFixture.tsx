import { DM_MAX_LENGTH } from '@shared/friends.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import { ChatScreen, DayLine } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { ChatOptionsMenu } from '@/features/chat/ChatOptionsMenu';
import { DISTRICT_MUTES_KEY, endSessionOptions } from '@/features/district/RoomSheets';
import { tr } from '@/i18n/tr';
import { Dialog } from '@/motion/Dialog';
import { DM } from '@/theme/dm';
import { SPACING } from '@/theme/tokens';

// The semt room with its ⋮ menu or its dialog open, for the visual gate's `ekran/semt/secenekler`
// and `ekran/semt/oturum-kapat` (the asking dialog): the route's menu (features/chat/
// ChatOptionsMenu) and dialog (features/district/RoomSheets) over the room's bar and two bubbles; no
// server (an own query client with an empty muted list). The gate's route has no OverlayHost, so
// the dialog is drawn here.
const NAME = 'Avcılar';

export function SemtSheetFixture({ sheet }: { sheet: 'options' | 'end' }) {
  const [client] = useState(() => {
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(DISTRICT_MUTES_KEY, { mutes: [] });
    return c;
  });
  const noop = () => undefined;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Where the bar's ⋮ stands (ChatTopBar `dm`: 16 from the right, 6 under the status bar).
  const at = {
    x: width - DM.bar.side - DM.bar.more,
    y: insets.top + SPACING[1.5] + (DM.bar.pill - DM.bar.more) / 2,
    width: DM.bar.more,
    height: DM.bar.more,
  };
  return (
    <QueryClientProvider client={client}>
      <ChatScreen
        wall="semt"
        top={
          <ChatTopBar
            dm
            onBack={noop}
            title={tr.district.room.title(NAME)}
            titleLines={1}
            more={
              <ChatOptionsMenu
                label={tr.district.room.options}
                testID="district-chat-options"
                onPeople={noop}
                onLeave={noop}
                openAt={sheet === 'options' ? at : undefined}
              />
            }
          />
        }
        composer={
          <Composer
            sendLabel={tr.dm.send}
            placeholder={tr.district.room.placeholder(NAME)}
            value=""
            onChangeText={noop}
            maxLength={DM_MAX_LENGTH}
            sendDisabled
            onSend={noop}
          />
        }
      >
        <DayLine label="Bugün" />
        <ChatBubble text="Akşam sahilde yürüyen var mı?" mine={false} first time="20:41" />
        <ChatBubble text="Ben çıkıyorum birazdan" mine first time="20:43" delivery="read" />
      </ChatScreen>
      {sheet === 'end' ? (
        <View style={StyleSheet.absoluteFill}>
          <Dialog
            options={endSessionOptions(async () => undefined)}
            visible
            running={null}
            onConfirm={noop}
            onOther={noop}
            onCancel={noop}
            onHidden={noop}
          />
        </View>
      ) : null}
    </QueryClientProvider>
  );
}
