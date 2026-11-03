import { isIntent } from '@shared/rooms.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';

import { Btn, Glass, Live, T, Tag, useKit } from '@/aura/kit';
import { Pips } from '@/aura/Pips';
import { PICTURE_FILL } from '@/aura/RisoPicture';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';

import { InviteSheet } from './InviteSheet';
import { roomKeys, type TableRoomRow, useTablePeople } from './queries';
import { PersonFace } from './RoomPeople';
import { TABLE_CARD_WIDE } from './tableIconImages';
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

// The person's table at the top of Mekan. Without one: the riso "Henüz masan yok" scene (U19).
// With one (U20, MekanMasali): its wide riso card on glass, "Masan" and its name on dark glass at the
// picture's top left, the people's faces along its bottom; the picture opens the table. Under
// it the headcount and the lobby state; the owner gets "Lobiye aç" or "Lobiden çek" and "Davet et",
// side by side (docs/SPEC_V4.md §4.E).
export function TableCard({ checkIn, room, state, onCreate, onOpenLobby }: Props) {
  const queryClient = useQueryClient();
  const { c } = useKit();
  const [invite, setInvite] = useState(false);
  // The picture's width: the name glass lays the blurred picture under itself at the same size.
  const [width, setWidth] = useState(0);

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
  // A full table invites no one: "Davet et" is passive and the card says why (7.4).
  const full = room.phones >= MAX_TABLE_PHONES;
  const picture = room.icon ? TABLE_CARD_WIDE[room.icon] : undefined;
  const k = KIT.tableCard;
  return (
    <Glass testID="table-card" radius={k.radius} style={{ padding: k.pad }}>
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
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={{
              height: k.height,
              borderRadius: k.imageRadius,
              overflow: 'hidden',
              backgroundColor: c.placeholder,
              opacity: pressed ? PRESSED : 1,
            }}
          >
            {picture ? (
              <Image
                source={picture}
                fadeDuration={0}
                accessible={false}
                resizeMode="cover"
                style={PICTURE_FILL}
              />
            ) : null}
            {/* The name glass at the top left, the faces along the bottom on the whole width (the
                owner's call, 2 Kasım, 7.7). */}
            <View
              style={{
                position: 'absolute',
                left: k.inset,
                top: k.inset,
                right: k.inset,
                flexDirection: 'row',
              }}
            >
              <NameGlass picture={picture} width={width} name={room.name ?? ''} />
            </View>
            <View
              style={{
                position: 'absolute',
                left: k.inset,
                right: k.inset,
                bottom: k.inset,
                flexDirection: 'row',
              }}
            >
              <PeopleFaces roomId={room.id} phones={room.phones} me={checkIn.id} />
            </View>
          </View>
        )}
      </Pressable>

      <View
        style={{
          paddingTop: k.body.top,
          paddingHorizontal: k.body.x,
          paddingBottom: k.body.bottom,
          gap: k.body.gap,
        }}
      >
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
          {live ? <Live label={tr.venue.lobbyOpen} /> : <Tag label={tr.venue.lobbyOff} />}
        </View>

        {live && (intent || tag) ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipGap }}>
            {intent ? (
              <Tag tone={intent === 'game' ? 'purple' : 'pink'} label={tr.intents[intent]} />
            ) : null}
            {tag ? <Tag label={tr.concepts[tag]} /> : null}
          </View>
        ) : null}

        {owner ? (
          <View style={{ flexDirection: 'row', gap: KIT.size.chipsGap }}>
            {state === 'private' ? (
              <Btn
                sm
                icon="list"
                testID="lobby-open"
                label={tr.venue.openLobby}
                onPress={onOpenLobby}
                style={EQUAL}
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
                style={EQUAL}
              />
            )}
            <Btn
              sm
              variant="glassy"
              icon="invite"
              testID="invite-open"
              label={tr.venue.invite}
              disabled={full}
              onPress={() => setInvite(true)}
              style={EQUAL}
            />
          </View>
        ) : null}
        {owner && full ? (
          <T v="fine" testID="table-full">
            {tr.invite.full}
          </T>
        ) : null}

        {withdraw.error ? (
          <T v="fine" color={KIT.danger}>
            {errorMessage(withdraw.error)}
          </T>
        ) : null}
      </View>

      {owner ? (
        <InviteSheet
          visible={invite}
          onClose={() => setInvite(false)}
          roomId={room.id}
          phones={room.phones}
        />
      ) : null}
    </Glass>
  );
}

const PRESSED = 0.8;
// Lobiye aç (or Lobiden çek) and Davet et share the row equally (MekanMasali `.grow`).
const EQUAL = { flex: 1 };
// The faces overlap a little, each on a white ring.
const FACE_OVERLAP = 8;

// "Masan" and the table's name on dark glass at the card's top left (MekanMasali `.mname`; moved up
// by the owner's call, 2 Kasım). The glass's blur is the card's own picture blurred once and laid
// under the tint at the same place (the card's top edge `inset` above the glass's): no live
// backdrop inside a card.
function NameGlass({
  picture,
  width,
  name,
}: {
  picture: ImageSourcePropType | undefined;
  width: number;
  name: string;
}) {
  const n = KIT.tableCard.name;
  const inset = KIT.tableCard.inset;
  return (
    <View
      testID="table-name-glass"
      style={{ flexShrink: 1, borderRadius: n.radius, overflow: 'hidden' }}
    >
      {picture && width > 0 ? (
        <Image
          source={picture}
          blurRadius={n.blur}
          fadeDuration={0}
          accessible={false}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: -inset,
            top: -inset,
            width,
            height: KIT.tableCard.height,
          }}
        />
      ) : null}
      <View
        style={{
          paddingHorizontal: n.padX,
          paddingVertical: n.padY,
          backgroundColor: n.fill,
        }}
      >
        <T v="eyebrow" color={n.eyebrow}>
          {tr.rooms.roomEyebrow(null)}
        </T>
        <T v="title" color={KIT.white} testID="table-name">
          {name}
        </T>
      </View>
    </View>
  );
}

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
  // All of them along the picture's bottom, whatever their number (the owner's report, 29 Ekim: twelve
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
      style={{ flex: 1, minWidth: side, flexDirection: 'row', justifyContent: 'flex-end' }}
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
  const { c, scheme } = useKit();
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
          style={PICTURE_FILL}
        />
        {/* The dark scheme dims the light scene a little (the owner's report, 2 Kasım, 6.2). */}
        {scheme === 'dark' ? (
          <View style={[PICTURE_FILL, { backgroundColor: r.darkVeil }]} />
        ) : null}
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
