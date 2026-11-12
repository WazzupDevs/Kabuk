import { isIntent } from '@shared/rooms.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as Picture } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, type BtnLook, T, Tag, useKit } from '@/aura/kit';
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
import { VENUE } from '@/theme/venue';

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

const fold = AURA.venueCollapse;
const V = VENUE;

// The person's table at the top of Mekan (docs/design/iskelet.md → 5.11; tuval Mekan, theme/venue.ts),
// one card that pins under the bar and folds into a 72 strip as the screen scrolls (CollapsingCard).
// Without a table: the riso picture over the whole card, the words on the paper's fade at its left,
// "Masa kur". With one: the picture on the whole width (210) with the name on its dark fade and the
// state at its corner; the picture opens the table. Under it the people in one row (a profiled
// one's photo, an anonymous one's capsule; an empty chair while there is room), the thin fill and
// its sentence; the owner gets "Lobiye aç" (or "Lobiden çek") and "Davet et", both passive while
// the table is full (the server answers table_full, 6.2). docs/SPEC_V4.md §4.E.
export function TableCard({ checkIn, room, state, onCreate, onOpenLobby, band }: Props) {
  const { scheme } = useKit();
  const look = V[scheme];
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
        radius={V.card.radius}
        stripRadius={V.card.stripRadius}
        face={look.card}
        band={band}
        folded={
          <Strip
            picture={NO_TABLE_SCENE}
            name={tr.venue.noTable}
            status={null}
            dot={null}
            action={
              <Btn
                sm
                testID="table-create-open"
                label={tr.venue.createTable}
                onPress={onCreate}
                look={STRIP_BUTTON}
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
  const dot = full ? look.dot.full : live ? look.dot.open : look.dot.off;
  const openTable = () => router.push({ pathname: '/room/[id]', params: { id: room.id } });
  const lobbyButton = (small: boolean) =>
    state === 'private' ? (
      <Btn
        sm={small}
        icon={small ? undefined : 'list'}
        testID="lobby-open"
        label={tr.venue.openLobby}
        disabled={full}
        onPress={onOpenLobby}
        look={small ? STRIP_BUTTON : BIG_BUTTON}
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
        tint={look.clearInk}
        look={BIG_BUTTON}
        style={EQUAL}
      />
    ) : null;
  const B = V.table.body;
  return (
    <CollapsingCard
      testID="table-card"
      strip={fold.tableStrip}
      radius={V.card.radius}
      stripRadius={V.card.stripRadius}
      face={look.card}
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
            dot={dot}
            action={owner ? lobbyButton(true) : null}
          />
        </Tap>
      }
    >
      <Tap
        testID="go-to-table"
        sink={false}
        accessibilityLabel={tr.venue.tableHead(room.name ?? '', room.phones, status)}
        onPress={openTable}
        style={{ height: V.table.height, overflow: 'hidden' }}
      >
        <PictureGround picture={picture} />
        {/* The name on the same dark fade on every card. */}
        <View
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0, height: V.table.shadeHeight },
            gradientStyle(look.shade),
          ]}
        />
        <View
          style={{
            position: 'absolute',
            left: V.table.nameX,
            right: V.table.nameX,
            bottom: V.table.nameY,
          }}
        >
          <T v="cardHero" color={KIT.white} testID="table-name" fit lines={2}>
            {room.name ?? ''}
          </T>
        </View>
        <View
          style={{ position: 'absolute', top: V.table.status.inset, right: V.table.status.inset }}
        >
          <StatusTag label={status} dot={dot} />
        </View>
      </Tap>

      <View
        style={{
          paddingTop: B.top,
          paddingHorizontal: B.x,
          paddingBottom: B.bottom,
          gap: B.gap,
        }}
      >
        <View style={{ gap: B.inner }}>
          <Seats roomId={room.id} phones={room.phones} me={checkIn.id} />
          <View testID="table-state" style={{ gap: B.inner }}>
            <Meter phones={room.phones} />
            <T v="friendSince" color={look.sentence} testID={full ? 'table-full' : undefined}>
              {full
                ? tr.venue.seatsFull
                : room.phones <= 1
                  ? tr.venue.seatsAlone
                  : tr.venue.seated(room.phones)}
            </T>
          </View>
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
          <View style={{ flexDirection: 'row', gap: V.table.buttons.gap }}>
            {lobbyButton(false)}
            <Btn
              variant="glassy"
              icon="invite"
              testID="invite-open"
              label={tr.venue.invite}
              disabled={full}
              onPress={() => setInvite(true)}
              tint={look.clearInk}
              look={BIG_BUTTON}
              style={[EQUAL, { marginRight: V.table.buttons.inviteRight }]}
            />
          </View>
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
    </CollapsingCard>
  );
}

// Lobiye aç (or Lobiden çek) and Davet et share the row equally; their words 15.5/800, the icons 17
// and 8 from them. The strip's small one 14/800, 14 in, no icon.
const EQUAL = { flex: 1 };
const BIG_BUTTON: BtnLook = {
  type: 'tableBtn',
  icon: VENUE.table.buttons.icon,
  gap: VENUE.table.buttons.iconGap,
};
const STRIP_BUTTON: BtnLook = {
  type: 'stripBtn',
  padLeft: VENUE.strip.buttonPadX,
  padRight: VENUE.strip.buttonPadX,
};

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

// A state's dot (7) before its words.
function Dot({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  );
}

// The state at the picture's corner: a white pill with its dot, drawn (no live blur in a card, 2.2).
function StatusTag({ label, dot }: { label: string; dot: string }) {
  const { scheme } = useKit();
  const s = V.table.status;
  return (
    <View
      style={{
        height: s.height,
        paddingLeft: s.padLeft,
        paddingRight: s.padRight,
        borderRadius: s.height / 2,
        backgroundColor: V[scheme].status.fill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: s.gap,
      }}
    >
      <Dot color={dot} size={s.dot} />
      <T v="detailPill" color={V[scheme].status.ink}>
        {label}
      </T>
    </View>
  );
}

// The thin fill of the table's seats: green while there is room, pink once full.
function Meter({ phones }: { phones: number }) {
  const { scheme } = useKit();
  const m = V[scheme].meter;
  const height = V.table.meter;
  const full = phones >= MAX_TABLE_PHONES;
  const share = Math.min(1, Math.max(0, phones / MAX_TABLE_PHONES));
  return (
    <View
      accessible={false}
      style={{ height, borderRadius: height / 2, backgroundColor: m.track, overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${share * 100}%`,
          height,
          borderRadius: height / 2,
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
  const { scheme } = useKit();
  const look = V[scheme];
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
  const f = V.table.face;
  // The face and its ring of the card's ground around it.
  const side = f.side + 2 * f.ring;
  const faceShadow = boxShadowParts(useLabOff('golge'), look.faceShadow || undefined, side / 2);
  const sorted = [...(people.data ?? [])].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const room = phones < MAX_TABLE_PHONES;
  // One row whatever their number: they overlap more when they must.
  const n = sorted.length + (room ? 1 : 0);
  const least = side - f.pitch;
  const overlap = width > 0 && n > 1 ? Math.max(least, (n * side - width) / (n - 1)) : least;
  // The empty chair (no ring) 28 after the last face's start.
  const seatAfter = -(side - f.ring - f.seatPitch + (overlap - least));
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: side }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {sorted.map((p, i) => (
        <View
          key={p.sessionId}
          style={{
            marginLeft: i === 0 ? -f.ring : -overlap,
            borderRadius: side / 2,
            borderWidth: f.ring,
            borderColor: look.faceRing,
            backgroundColor: look.faceRing,
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
            marginLeft: sorted.length === 0 ? 0 : seatAfter,
            width: f.side,
            height: f.side,
            borderRadius: f.side / 2,
            borderWidth: f.dash,
            borderStyle: 'dashed',
            borderColor: look.seat.edge,
            backgroundColor: look.seat.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CapIcon name="plus" color={look.seat.plus} size={f.plus} />
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
  dot,
  action,
}: {
  picture: ImageSourcePropType | undefined;
  name: string;
  status: string | null;
  dot: string | null;
  action: ReactNode;
}) {
  const { scheme } = useKit();
  const S = V.strip;
  const side = fold.stripPicture;
  return (
    <View
      style={{
        height: fold.tableStrip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.gap,
        paddingHorizontal: S.padX,
      }}
    >
      <View style={{ width: side, height: side, borderRadius: S.radius, overflow: 'hidden' }}>
        <PictureGround picture={picture} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: S.lineGap }}>
        <T v="barName" ink lines={1} fit>
          {name}
        </T>
        {status ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.dotGap }}>
            {dot ? <Dot color={dot} size={S.dot} /> : null}
            <T v="detailPill" color={V[scheme].stripSub}>
              {status}
            </T>
          </View>
        ) : null}
      </View>
      {action}
    </View>
  );
}

// No table yet: the riso picture over the whole card, the words on the paper's fade at its left,
// "Masa kur" prominent. The dark scheme dims the light picture a little.
const NO_TABLE_SCENE = require('../../../assets/riso/venue-no-table.webp');
function NoTable({ onCreate }: { onCreate: () => void }) {
  const { scheme } = useKit();
  const look = V[scheme];
  const N = V.none;
  return (
    <View
      testID="no-table"
      style={{ minHeight: N.height, backgroundColor: look.paper, justifyContent: 'flex-start' }}
    >
      <Picture
        source={NO_TABLE_SCENE}
        accessible={false}
        contentFit="cover"
        contentPosition={{ left: N.picX, top: N.picY }}
        style={PICTURE_FILL}
      />
      {scheme === 'dark' ? (
        <View style={[PICTURE_FILL, { backgroundColor: KIT.risoScene.darkVeil }]} />
      ) : null}
      <View style={[PICTURE_FILL, gradientStyle(look.paperFade)]} />
      <View
        style={{
          paddingVertical: N.padY,
          paddingHorizontal: N.padX,
          maxWidth: N.words,
          gap: N.gap,
        }}
      >
        <T v="cardHero" color={look.heroTitle}>
          {tr.venue.noTable}
        </T>
        <T v="cardHeroNote" color={look.heroNote}>
          {tr.venue.noTableHint}
        </T>
        <Btn
          icon="plus"
          testID="table-create-open"
          label={tr.venue.createTable}
          onPress={onCreate}
          look={{
            type: 'confirmBtn',
            padLeft: N.buttonPadLeft,
            padRight: N.buttonPadRight,
            icon: N.icon,
            gap: V.table.buttons.iconGap,
          }}
          style={{ alignSelf: 'flex-start', marginTop: N.buttonTop }}
        />
      </View>
    </View>
  );
}
