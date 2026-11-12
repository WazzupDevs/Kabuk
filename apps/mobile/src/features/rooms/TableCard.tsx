import { isIntent } from '@shared/rooms.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as Picture } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

import { Btn, T, Tag, useKit } from '@/aura/kit';
import { PICTURE_FILL } from '@/aura/RisoPicture';
import { boxShadowParts } from '@/components/NativeShadow';
import { useRoomMemberProfiles } from '@/features/profile/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { roomsApi } from '@/lib/api';
import { useLabOff } from '@/lib/drawLab';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { CollapsingCard, Tap } from '@/motion';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { gradientStyle } from '@/theme/gradient';

import { InviteSheet } from './InviteSheet';
import { roomKeys, type TableRoomRow, useTablePeople } from './queries';
import { PersonFace } from './RoomPeople';
import { TABLE_CARD_WIDE } from './tableIconImages';

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
  // How far under its strip the screen's band reaches once it is folded (the venue chat's strip).
  band: number;
};

const k = KIT.tableCard;
const fold = AURA.venueCollapse;

// The person's table at the top of Mekan (docs/design/iskelet.md → 5.11), one card that pins under
// the bar and folds into a 72 strip as the screen scrolls (CollapsingCard). Without a table: the
// riso picture against the card's right, the words on the paper's fade, "Masa kur". With one: the
// picture on the whole width (210) with the name on its dark fade and the glass state at its
// corner; the picture opens the table. Under it the people in one row (a profiled one's photo, an
// anonymous one's capsule; an empty chair while there is room), the thin fill and its sentence; the
// owner gets "Lobiye aç" (or "Lobiden çek") and "Davet et", both passive while the table is full
// (the server answers table_full, 6.2). docs/SPEC_V4.md §4.E.
export function TableCard({ checkIn, room, state, onCreate, onOpenLobby, band }: Props) {
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

  if (state === 'none' || !room) {
    return (
      <CollapsingCard
        testID="table-card"
        strip={fold.tableStrip}
        radius={k.radius}
        band={band}
        folded={
          <Strip
            picture={NO_TABLE_SCENE}
            name={tr.venue.noTable}
            status={null}
            action={
              <Btn
                sm
                icon="plus"
                testID="table-create-open"
                label={tr.venue.createTable}
                onPress={onCreate}
              />
            }
          />
        }
      >
        <NoTable onCreate={onCreate} />
      </CollapsingCard>
    );
  }

  const intent = isIntent(room.intent) ? room.intent : null;
  const tag = gameTag(room.game_tag);
  const owner = state === 'private' || state === 'open';
  const live = state === 'open';
  // A full table invites no one and opens to no lobby (6.2).
  const full = room.phones >= MAX_TABLE_PHONES;
  const picture = room.icon ? TABLE_CARD_WIDE[room.icon] : undefined;
  const status = full ? tr.venue.statusFull : live ? tr.venue.lobbyOpen : tr.venue.lobbyOff;
  const openTable = () => router.push({ pathname: '/room/[id]', params: { id: room.id } });
  const lobbyButton = (small: boolean) =>
    state === 'private' ? (
      <Btn
        sm={small}
        icon="list"
        testID="lobby-open"
        label={tr.venue.openLobby}
        disabled={full}
        onPress={onOpenLobby}
        style={small ? undefined : EQUAL}
      />
    ) : state === 'open' && !small ? (
      <Btn
        variant="glassy"
        icon="close"
        testID="withdraw-table"
        label={tr.venue.withdraw}
        onPress={() => withdraw.mutate()}
        loading={withdraw.isPending}
        style={EQUAL}
      />
    ) : null;
  return (
    <CollapsingCard
      testID="table-card"
      strip={fold.tableStrip}
      radius={k.radius}
      band={band}
      folded={
        <Tap
          sink={false}
          accessibilityLabel={tr.venue.tableHead(room.name ?? '', room.phones, status)}
          onPress={openTable}
        >
          <Strip
            picture={picture}
            name={room.name ?? ''}
            status={status}
            action={owner ? lobbyButton(true) : null}
          />
        </Tap>
      }
    >
      <View style={{ padding: k.pad }}>
        <Tap
          testID="go-to-table"
          sink={false}
          accessibilityLabel={tr.venue.tableHead(room.name ?? '', room.phones, status)}
          onPress={openTable}
          style={{
            height: k.height,
            borderRadius: k.imageRadius,
            overflow: 'hidden',
          }}
        >
          <PictureGround picture={picture} />
          {/* The name on the same dark fade on every card. */}
          <View
            style={[
              { position: 'absolute', left: 0, right: 0, bottom: 0, height: k.shadeHeight },
              gradientStyle(k.shade),
            ]}
          />
          <View style={{ position: 'absolute', left: k.inset, right: k.inset, bottom: k.inset }}>
            <T v="title" color={KIT.white} testID="table-name" fit lines={2}>
              {room.name ?? ''}
            </T>
          </View>
          <View style={{ position: 'absolute', top: k.inset, right: k.inset }}>
            <StatusTag label={status} />
          </View>
        </Tap>

        <View
          style={{
            paddingTop: k.body.top,
            paddingHorizontal: k.body.x,
            paddingBottom: k.body.bottom,
            gap: k.body.gap,
          }}
        >
          <Seats roomId={room.id} phones={room.phones} me={checkIn.id} />
          <View testID="table-state" style={{ gap: KIT.size.chipGap }}>
            <Meter phones={room.phones} />
            <T v="fine" testID={full ? 'table-full' : undefined}>
              {full
                ? tr.venue.seatsFull
                : room.phones <= 1
                  ? tr.venue.seatsAlone
                  : tr.venue.seated(room.phones)}
            </T>
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
              {lobbyButton(false)}
              <Btn
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

          {withdraw.error ? (
            <T v="fine" color={KIT.danger}>
              {errorMessage(withdraw.error)}
            </T>
          ) : null}
        </View>
      </View>

      {owner ? (
        <InviteSheet
          visible={invite}
          onClose={() => setInvite(false)}
          roomId={room.id}
          phones={room.phones}
        />
      ) : null}
    </CollapsingCard>
  );
}

// Lobiye aç (or Lobiden çek) and Davet et share the row equally.
const EQUAL = { flex: 1 };

function PictureGround({ picture }: { picture: ImageSourcePropType | undefined }) {
  const { c } = useKit();
  return (
    <View style={[PICTURE_FILL, { backgroundColor: c.placeholder }]}>
      {picture ? (
        <Image
          source={picture}
          fadeDuration={0}
          accessible={false}
          resizeMode="cover"
          style={PICTURE_FILL}
        />
      ) : null}
    </View>
  );
}

// The state at the picture's corner: a clear glass tag, drawn (no live blur in a card, 2.2).
function StatusTag({ label }: { label: string }) {
  const s = k.status;
  return (
    <View
      style={{
        paddingHorizontal: s.padX,
        paddingVertical: s.padY,
        borderRadius: KIT.size.btn,
        backgroundColor: s.fill,
        borderWidth: KIT.size.edge,
        borderColor: s.edge,
      }}
    >
      <T v="tag" color={s.ink}>
        {label}
      </T>
    </View>
  );
}

// The thin fill of the table's seats: green while there is room, pink once full.
function Meter({ phones }: { phones: number }) {
  const { c } = useKit();
  const m = k.meter;
  const full = phones >= MAX_TABLE_PHONES;
  const share = Math.min(1, Math.max(0, phones / MAX_TABLE_PHONES));
  return (
    <View
      accessible={false}
      style={{ height: m.height, borderRadius: m.height / 2, backgroundColor: c.hair }}
    >
      <View
        style={{
          width: `${share * 100}%`,
          height: m.height,
          borderRadius: m.height / 2,
          backgroundColor: full ? m.full : m.free,
        }}
      />
    </View>
  );
}

// The people at the table in one row, in the order they sat: a profiled person's photo, an
// anonymous one's capsule, each apart on the card's ground (2.4); an empty chair at the end while
// there is room. The people's faces go to everyone at the table while it runs (rule 4); the list is
// read again when the count changes.
function Seats({ roomId, phones, me }: { roomId: string; phones: number; me: string }) {
  const { c, scheme } = useKit();
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
  const f = k.face;
  const side = KIT.size.av.sm + 2 * f.ring;
  const faceShadow = boxShadowParts(useLabOff('golge'), f.shadow, side / 2);
  const sorted = [...(people.data ?? [])].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const room = phones < MAX_TABLE_PHONES;
  // One row whatever their number: they overlap more when they must.
  const n = sorted.length + (room ? 1 : 0);
  const overlap =
    width > 0 && n > 1 ? Math.max(f.overlap, (n * side - width) / (n - 1)) : f.overlap;
  const ground = k.ground[scheme];
  return (
    <View
      style={{ flexDirection: 'row', minHeight: side }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {sorted.map((p, i) => (
        <View
          key={p.sessionId}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            borderRadius: side / 2,
            borderWidth: f.ring,
            borderColor: ground,
            backgroundColor: ground,
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
      {room ? (
        <View
          style={{
            marginLeft: sorted.length === 0 ? 0 : -overlap,
            width: side,
            height: side,
            borderRadius: side / 2,
            borderWidth: f.ring,
            borderColor: ground,
            backgroundColor: ground,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: side / 2,
              borderWidth: f.dash,
              borderStyle: 'dashed',
              borderColor: c.muted,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

// The strip the card folds into (72): its picture 52, the name, the state and a small action.
function Strip({
  picture,
  name,
  status,
  action,
}: {
  picture: ImageSourcePropType | undefined;
  name: string;
  status: string | null;
  action: ReactNode;
}) {
  const side = fold.stripPicture;
  return (
    <View
      style={{
        height: fold.tableStrip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: KIT.size.liGap,
        paddingHorizontal: k.stripPad,
      }}
    >
      <View style={{ width: side, height: side, borderRadius: k.stripRadius, overflow: 'hidden' }}>
        <PictureGround picture={picture} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="h3" lines={1} fit>
          {name}
        </T>
        {status ? <T v="fine">{status}</T> : null}
      </View>
      {action}
    </View>
  );
}

// No table yet: the riso picture against the card's right, the words on the paper's fade at its
// left, "Masa kur" prominent. The dark scheme dims the light picture a little.
const NO_TABLE_SCENE = require('../../../assets/riso/venue-no-table.webp');
function NoTable({ onCreate }: { onCreate: () => void }) {
  const { scheme } = useKit();
  const r = KIT.risoScene;
  return (
    <View
      testID="no-table"
      style={{ height: KIT.size.hero, backgroundColor: k.paper, justifyContent: 'center' }}
    >
      <Picture
        source={NO_TABLE_SCENE}
        accessible={false}
        contentFit="cover"
        contentPosition="right"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${k.paperPicture * 100}%`,
        }}
      />
      {scheme === 'dark' ? <View style={[PICTURE_FILL, { backgroundColor: r.darkVeil }]} /> : null}
      <View style={[PICTURE_FILL, gradientStyle(k.paperFade)]} />
      <View style={{ marginLeft: KIT.size.heroPad, width: r.words, gap: r.gap }}>
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
  );
}
