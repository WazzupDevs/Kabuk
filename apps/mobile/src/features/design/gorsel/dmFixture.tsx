import { DM_MAX_LENGTH } from '@shared/friends.ts';

import { Avatar } from '@/components/Avatar';
import { ChatBubble, TypingBubble } from '@/components/ChatBubble';
import { ChatScreen, DayLine } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Composer } from '@/components/Composer';
import { IconButton } from '@/components/IconButton';
import { tr } from '@/i18n/tr';

// The DM screen with the board's sample (docs/design/yeni-arayuz/project/DmSohbet.dc.html), for the visual
// gate's `ekran/dm`: the same components the route draws (app/(app)/(tabs)/messages/[threadId].tsx),
// fed fixed data, no server.
const NAME = 'Fevve';
const MINE = 'Vampir masası kuruluyor';

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
              // U29: moreV.
              icon="ellipsis-vertical"
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
      <ChatBubble text="Selam, bu akşam çıkıyor musun?" mine={false} first time="22:02" />
      <ChatBubble text="Kampüstekiler toplanıyormuş" mine={false} first={false} time="22:02" />
      <ChatBubble text="Bu akşam Lale'de misin?" mine first time="22:10" />
      <ChatBubble text={MINE} mine first={false} time="22:10" delivery="read" />
      <ChatBubble
        text="Geliyorum, 10 dk"
        mine={false}
        first
        time="22:14"
        reactions={[
          { emoji: 'begen', count: 1, mine: false },
          { emoji: 'ask', count: 2, mine: false },
        ]}
      />
      <DayLine label="Bugün" />
      <DayLine label={tr.chat.newMessages(2)} fresh />
      <ChatBubble
        text="Bana köylü düşsün bu sefer"
        mine={false}
        first
        time="18:08"
        quote={{ name: tr.chat.you, text: MINE }}
      />
      <ChatBubble text="Nerelerdesin?" mine={false} first={false} time="18:10" />
      <TypingBubble />
    </ChatScreen>
  );
}
