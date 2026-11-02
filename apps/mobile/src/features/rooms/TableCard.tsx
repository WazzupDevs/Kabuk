import { isIntent } from '@shared/rooms.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Btn, Disk, Live, T, Tag, useKit } from '@/aura/kit';
import { Pips } from '@/aura/Pips';
import { SceneGround } from '@/aura/Scene';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { AURA } from '@/theme/aura';
import { KIT, KIT_TYPE } from '@/theme/auraKit';

import { InviteSheet } from './InviteSheet';
import { roomKeys, type TableRoomRow, useTablePeople } from './queries';
import { PersonFace } from './RoomPeople';
import { TABLE_ICON_IMAGES } from './tableIconImages';
import { useLabOff } from '@/lib/drawLab';
import { boxShadowParts, shadowParts } from '@/components/NativeShadow';

type CheckIn = {
  id: string;
  venue_id: string;
};

type Props = {
  checkIn: CheckIn;
  room: TableRoomRow | null;
  state: TableState;
  // "Masa kur" and "Lobiye aç": the venue screen's sheets.
  onCreate: () => void;
  onOpenLobby: () => void;
};

// The person's scene at the top of Mekan (docs/design/aura → Mekan: `.scene` 210 high). Without a
// table: "Henüz masan yok", its line and "Masa kur" (44 high) at the left, the capsule buddies
// standing at the right. With one: "Masan", its name, people and lobby state at the left, its picture on a
// white-ringed disk at the right, the people's faces; the head opens the table. The owner gets
// "Lobiye aç" or "Lobiden çek" and "Davet et" (docs/SPEC_V4.md §4.E).
export function TableCard({ checkIn, room, state, onCreate, onOpenLobby }: Props) {
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState(false);

  const settle = () => {
    void queryClient.invalidateQueries({ queryKey: roomKeys.current });
    void queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(checkIn.venue_id) });
    if (room) void queryClient.invalidateQueries({ queryKey: roomKeys.room(room.id) });
  };
  // "Lobiden çek": the table stays, only out of the lobby.
  const withdraw = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => roomsApi.setVisibility(room?.id ?? '', false),
    onSettled: settle,
  });

  if (state === 'none' || !room) return <NoTable onCreate={onCreate} />;

  const intent = isIntent(room.intent) ? room.intent : null;
  const tag = gameTag(room.game_tag);
  const owner = state === 'private' || state === 'open';
  const live = state === 'open';
  const picture = room.icon ? TABLE_ICON_IMAGES[room.icon] : undefined;
  return (
    <View testID="table-card" style={[SCENE, { gap: ROW_GAP }]}>
      <SceneGround />
      <Pressable
        testID="go-to-table"
        accessibilityRole="button"
        accessibilityLabel={tr.venue.tableHead(
          room.name ?? '',
          room.phones,
          live ? tr.venue.lobbyOpen : tr.venue.lobbyOff,
        )}
        onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
      >
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: ROW_GAP,
              opacity: pressed ? PRESSED : 1,
            }}
          >
            <View style={{ flex: 1, gap: WORDS_GAP }}>
              <T v="eyebrow">{tr.rooms.roomEyebrow(null)}</T>
              <T v="title" style={HERO_TITLE} testID="table-name">
                {room.name ?? ''}
              </T>
              <View
                testID="table-state"
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: KIT.size.chipsGap,
                }}
              >
                <Pips count={room.phones} />
                <T v="fine">{tr.venue.people(room.phones)}</T>
                {live ? <Live label={tr.venue.lobbyOpen} /> : <T v="fine">{tr.venue.lobbyOff}</T>}
              </View>
            </View>
            <Disk size={DISK}>
              {picture ? (
                <Image source={picture} fadeDuration={0} style={{ width: DISK, height: DISK }} />
              ) : (
                <View style={{ width: DISK, height: DISK, backgroundColor: KIT.white }} />
              )}
            </Disk>
          </View>
        )}
      </Pressable>

      <PeopleFaces roomId={room.id} phones={room.phones} me={checkIn.id} />

      {live && (intent || tag) ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipGap }}>
          {intent ? (
            <Tag tone={intent === 'game' ? 'purple' : 'pink'} label={tr.intents[intent]} />
          ) : null}
          {tag ? <Tag label={tr.concepts[tag]} /> : null}
        </View>
      ) : null}

      {owner ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}>
          {state === 'private' ? (
            <Btn
              sm
              icon="list"
              testID="lobby-open"
              label={tr.venue.openLobby}
              onPress={onOpenLobby}
            />
          ) : (
            <Btn
              sm
              variant="glassy"
              icon="close"
              testID="withdraw-table"
              label={tr.venue.withdraw}
              onPress={() => withdraw.mutate()}
              loading={withdraw.isPending}
            />
          )}
          <Btn
            sm
            variant="glassy"
            icon="invite"
            testID="invite-open"
            label={tr.venue.invite}
            onPress={() => setInvite(true)}
          />
        </View>
      ) : null}

      {withdraw.error ? (
        <T v="fine" color={KIT.danger}>
          {errorMessage(withdraw.error)}
        </T>
      ) : null}

      {owner ? (
        <InviteSheet
          visible={invite}
          onClose={() => setInvite(false)}
          roomId={room.id}
          phones={room.phones}
        />
      ) : null}
    </View>
  );
}

// The canvas's scene: 210 high, rounded 26, the words 20 in from the top left and 180 wide. The
// buddies keep their size (drawn on 196) at the scene's right foot.
const SCENE = {
  minHeight: KIT.size.hero,
  borderRadius: AURA.scene.radius,
  overflow: 'hidden' as const,
  padding: KIT.size.heroPad,
};
const WORDS_GAP = 6;
const ROW_GAP = 12;
const HERO_TITLE = KIT_TYPE.hero;
const DISK = 88;
const PRESSED = 0.8;
// The faces overlap a little, each on a white ring.
const FACE_OVERLAP = 8;

// The people at the table, in the order they sat: a profiled person's photo, an anonymous one's
// capsule. The people's faces go to everyone at the table while it runs (rule 4); the list is read
// again when the count changes.
function PeopleFaces({ roomId, phones, me }: { roomId: string; phones: number; me: string }) {
  const people = useTablePeople(roomId);
  const ids = (people.data ?? []).map((p) => p.sessionId).join(',');
  const profiles = useRoomMemberProfiles(roomId, ids).data;
  const refetch = people.refetch;
  const seen = useRef(phones);
  useEffect(() => {
    if (seen.current === phones) return;
    seen.current = phones;
    void refetch();
  }, [phones, refetch]);
  const [width, setWidth] = useState(0);
  const shadowOff = useLabOff('golge');
  const sorted = [...(people.data ?? [])].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  if (sorted.length === 0) return null;
  // All of them in the card's width, whatever their number (the owner's report, 29 Ekim: twelve
  // ran off the card): they overlap more when they must.
  const side = KIT.size.av.sm + 2 * KIT.size.avRing;
  // Each face's soft shadow natively (NativeShadow.tsx): the lobby scrolls.
  const faceShadow = shadowParts(
    shadowOff,
    KIT.avShadow,
    undefined,
    side / 2,
    true,
    KIT.size.avRing,
  );
  const n = sorted.length;
  const overlap =
    width > 0 && n > 1 ? Math.max(FACE_OVERLAP, (n * side - width) / (n - 1)) : FACE_OVERLAP;
  return (
    <View
      style={{ flexDirection: 'row' }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {sorted.map((p, i) => (
        <View
          key={p.sessionId}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            borderRadius: KIT.size.av.sm,
            borderWidth: KIT.size.avRing,
            borderColor: KIT.white,
            boxShadow: faceShadow.boxShadow,
          }}
        >
          {faceShadow.node}
          <PersonFace
            person={p}
            publicId={profiles?.get(p.sessionId)}
            size="sm"
            self={p.sessionId === me}
          />
        </View>
      ))}
    </View>
  );
}

// U19: no table yet. Mekan's riso scene 210 high, 28 round on the card's shadow; at its top left
// "Henüz masan yok" (title), its line (fine) and "Masa kur" (primary sm, 40), in the scene's ink in
// both schemes (Mekan `.rscene`).
const NO_TABLE_SCENE = require('../../../assets/riso/venue-no-table.webp');
function NoTable({ onCreate }: { onCreate: () => void }) {
  const { c } = useKit();
  const r = KIT.risoScene;
  const shadow = boxShadowParts(useLabOff('golge'), c.cardShadow || undefined, r.radius);
  return (
    <View
      testID="table-card"
      style={{ height: KIT.size.hero, borderRadius: r.radius, boxShadow: shadow.boxShadow }}
    >
      {shadow.node}
      <View style={{ flex: 1, borderRadius: r.radius, overflow: 'hidden' }}>
        <Image
          source={NO_TABLE_SCENE}
          fadeDuration={0}
          accessible={false}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
        <View
          testID="no-table"
          style={{
            position: 'absolute',
            left: KIT.size.heroPad,
            top: KIT.size.heroPad,
            width: r.words,
            gap: r.gap,
          }}
        >
          <T v="title" color={r.title}>
            {tr.venue.noTable}
          </T>
          <T v="fine" color={r.note}>
            {tr.venue.noTableHint}
          </T>
          <Btn
            sm
            icon="plus"
            testID="table-create-open"
            label={tr.venue.createTable}
            onPress={onCreate}
            style={{ alignSelf: 'flex-start', marginTop: r.buttonTop }}
          />
        </View>
      </View>
    </View>
  );
}
