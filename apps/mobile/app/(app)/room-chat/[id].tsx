import { REPORT_REASONS } from '@shared/chat.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ChatScreen } from '@/components/ChatScreen';
import { ChatTopBar } from '@/components/ChatTopBar';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { RoomComposer, useRoomChat, useRoomChatList } from '@/features/chat/ChatPanel';
import { ReportModal } from '@/features/chat/ReportModal';
import { useRoomChatSeen } from '@/features/chat/roomChatSeen';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { useRoom, useTablePeople } from '@/features/rooms/queries';
import { TABLE_CARD_TALL } from '@/features/rooms/tableIconImages';
import { tr } from '@/i18n/tr';
import { FxMoves } from '@/components/FxSvg';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

// Masa sohbeti on its own screen (the owner's call, 28 Ekim): opened from the chat button on
// Masa's bar, back returns to Masa. Only the table's people read it (rule 4, RLS); a table that
// closed, or a person no longer at it, goes back to Masa, which shows Masa bitti.
// The accessories move here (the owner's call, 7 Kasım; components/FxSvg.tsx → FxMoves).
export default function RoomChatScreen() {
  return (
    <FxMoves>
      <RoomChatScreenBody />
    </FxMoves>
  );
}

function RoomChatScreenBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkIn = useActiveTable();
  const room = useRoom(id);
  const open = !!room.data && room.data.status !== 'closed';
  const people = useTablePeople(id, open);
  const profiles = useRoomMemberProfiles(
    id,
    (people.data ?? []).map((p) => p.sessionId).join(','),
  ).data;
  const chat = useRoomChat(id);
  const mark = useRoomChatSeen((s) => s.mark);
  const sessionId = checkIn.data?.id;
  // The seats' looks for the set's balloon on an anonymous seat's messages (§4.U, 8 Kasım).
  const seats = new Map(
    (people.data ?? []).map((p) => [p.sessionId, { look: p.look, profiled: p.profiled }]),
  );
  const stream = useRoomChatList(chat, sessionId ?? '', profiles, id, seats);
  const messages = chat.messages.data ?? [];
  const newestAt = messages.at(-1)?.created_at;
  useEffect(() => {
    if (newestAt) mark(id, newestAt);
  }, [id, newestAt, mark]);

  const seated = !!people.data?.some((p) => p.sessionId === sessionId);
  const gone =
    (room.isSuccess && !open) || (people.isSuccess && !seated) || (checkIn.isSuccess && !sessionId);
  useEffect(() => {
    if (gone) router.back();
  }, [gone]);

  if (!sessionId || !room.data || gone) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <Loader />
        </View>
      </Screen>
    );
  }
  const newestOut = chat.outbox[chat.outbox.length - 1];
  const newestIn = messages.at(-1);
  return (
    <ChatScreen
      wall="masa"
      // U25: the wall is the table's tall riso card (K-82); an old table keeps the generic one.
      wallSource={room.data.icon ? TABLE_CARD_TALL[room.data.icon] : undefined}
      startAtEnd
      newestKey={newestOut?.localId ?? newestIn?.id}
      newestMine={newestOut ? true : newestIn?.session_id === sessionId}
      top={
        <ChatTopBar
          onBack={() => router.back()}
          split
          compact
          title={tr.table.chatTitle}
          subtitle={room.data.name ?? undefined}
        />
      }
      composer={<RoomComposer chat={chat} />}
      list={stream}
    >
      <ReportModal
        reasons={REPORT_REASONS}
        visible={chat.reporting !== null}
        pending={chat.report.isPending}
        error={chat.report.error}
        onReport={(reason) => chat.reporting && chat.report.mutate({ id: chat.reporting, reason })}
        onClose={() => chat.setReporting(null)}
      />
    </ChatScreen>
  );
}
