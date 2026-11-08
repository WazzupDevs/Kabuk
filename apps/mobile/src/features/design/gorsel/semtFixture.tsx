import { DM_MAX_LENGTH } from '@shared/friends.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { ChatBubble } from '@/components/ChatBubble';
import { ChatScreen, DayLine } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { IconButton, MoreDots } from '@/components/IconButton';
import { DISTRICT_MUTES_KEY, EndSheet, OptionsSheet } from '@/features/district/RoomSheets';
import { tr } from '@/i18n/tr';

// The semt room with one of its sheets open, for the visual gate's `ekran/semt/secenekler` (⋯) and
// `ekran/semt/oturum-kapat` (the asking sheet): the route's sheets (features/district/RoomSheets)
// over the room's bar and two bubbles; no server (an own query client with an empty muted list).
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
  return (
    <QueryClientProvider client={client}>
      <ChatScreen
        top={
          <ChatTopBar
            onBack={noop}
            title={tr.district.room.title(NAME)}
            titleLines={1}
            actions={
              <IconButton
                icon="ellipsis-vertical"
                glyph={<MoreDots />}
                label={tr.district.room.options}
                onPress={noop}
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
      <OptionsSheet visible={sheet === 'options'} onClose={noop} onChanged={noop} onEnd={noop} />
      <EndSheet visible={sheet === 'end'} onClose={noop} />
    </QueryClientProvider>
  );
}
