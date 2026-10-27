import { DM_MAX_LENGTH } from '@shared/friends.ts';

import { Avatar } from '@/components/Avatar';
import { ChatBubble, TypingBubble } from '@/components/ChatBubble';
import { ChatScreen, DayLine } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { IconButton, MoreDots } from '@/components/IconButton';
import { tr } from '@/i18n/tr';

// The DM screen with the skall tuvali's sample (docs/design/sistem/ekran/Dm.html), for the visual
// gate's `ekran/dm`: the same components the route draws (app/(app)/(tabs)/messages/[threadId].tsx),
// fed fixed data, no server.
const NAME = 'Ece';
const FIRST = 'Bugünkü Kapsül Anlat çok iyiydi';

export function DmFixture() {
  const noop = () => undefined;
  return (
    <ChatScreen
      top={
        <ChatTopBar
          onBack={noop}
          title={NAME}
          leading={<Avatar kind="profile" name={NAME} size="md" photoUrl={null} />}
          actions={
            <IconButton
              round
              icon="ellipsis-horizontal"
              glyph={<MoreDots />}
              label={tr.friends.more}
              onPress={noop}
            />
          }
        />
      }
      composer={
        <Composer
          sendLabel={tr.dm.send}
          placeholder={tr.dm.placeholder}
          value=""
          onChangeText={noop}
          maxLength={DM_MAX_LENGTH}
          sendDisabled
          onSend={noop}
        />
      }
    >
      <DayLine label="Dün" />
      <ChatBubble text={FIRST} mine={false} first time="22:10" />
      <ChatBubble
        text="Evet ya, son tur efsaneydi"
        mine
        first
        time="22:12"
        delivery="read"
        quote={{ name: NAME, text: FIRST }}
        reactions={[{ emoji: '❤️', count: 1, mine: false }]}
      />
      <DayLine label="Bugün" />
      <ChatBubble text="Yarın Kapsül Anlat'a var mısın?" mine={false} first time="21:39" />
      <ChatBubble
        text="Geçen sefer çok iyiydi, bu sefer kesin kazanırız"
        mine={false}
        first={false}
        time="21:40"
      />
      <TypingBubble />
    </ChatScreen>
  );
}
