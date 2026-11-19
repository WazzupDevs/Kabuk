import { isIntent } from '@shared/rooms.ts';
import { MAX_TABLE_PHONES } from '@shared/tables.ts';
import { gameTag, type TableState } from '@shared/tableCard.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as Picture } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Btn, type BtnLook, Round, T, Tag, useKit } from '@/aura/kit';
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
import { VENUE } from '@/theme/venue';

import { roomKeys, type TableRoomRow, useTablePeople } from './queries';
import { PersonFace } from './RoomPeople';
import { TABLE_CARD_WIDE, TABLE_ICON_IMAGES } from './tableIconImages';

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
  // "Açık masalar" on the card without a table: the screen goes down to its lobby.
  onShowLobby: () => void;
  // How far under its strip the screen's band reaches once it is folded (the venue chat's strip).
  band: number;
};

const fold = AURA.venueCollapse;
const V = VENUE;

// The person's table at the top of Mekan (yeni arayüz tuvali: MekanMasaYok, MekanMasa,
// MekanMasaDolu, MekanKaydir; docs/design/iskelet.md → 5.11; theme/venue.ts), one glass card that
// pins under the bar and folds into a 72 strip as the screen scrolls (CollapsingCard). Without a
// table: the riso picture on the card's width, under it the words, "Masa kur" and "Açık masalar".
// With one: the table's picture inside the card with the state at its corner and a panel at its
// foot: the name and the count out of 12, the people in one row (a profiled one's photo, an
// anonymous one's capsule; an empty chair while there is room), the thin fill and its sentence. The
// picture opens the table. Under it the owner gets "Lobiye aç" (or "Lobiden çek") and "Davet et",
// both passive while the table is full (the server answers table_full, 6.2). docs/SPEC_V4.md §4.E.
export function TableCard({
  checkIn,
  room,
  state,
  onCreate,
  onOpenLobby,
  onShowLobby,
  band,
}: Props) {
  const { scheme } = useKit();
  const look = V[scheme];
  const queryClient = useQueryClient();
  // Masana davet et is its own page (yeni arayüz tuvali, MasaDavet).
  const openInvite = () => {
    if (room) router.push({ pathname: '/room-invite/[id]', params: { id: room.id } });
  };

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
              <Btn sm testID="table-create-open" label={tr.venue.createTable} onPress={onCreate} />
            }
          />
        }
      >
        <NoTable onCreate={onCreate} onShowLobby={onShowLobby} />
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
  const square = room.icon ? TABLE_ICON_IMAGES[room.icon] : undefined;
  const status = full
    ? live
      ? tr.venue.statusLobbyFull
      : tr.venue.statusFull
    : live
      ? tr.venue.lobbyOpen
      : tr.venue.lobbyOff;
  const dot = full ? look.dot.full : live ? look.dot.open : look.dot.off;
  const count = tr.venue.seatsCount(room.phones, MAX_TABLE_PHONES);
  const openTable = () => router.push({ pathname: '/room/[id]', params: { id: room.id } });
  const B = V.table.buttons;
  const buttonLook: BtnLook = {
    type: 'btnSm',
    padLeft: B.padX,
    padRight: B.padX,
    icon: B.icon,
    gap: B.iconGap,
  };
  const P = V.table.panel;
  const strip = V.strip;
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
            picture={square}
            name={room.name ?? ''}
            status={tr.table.status(count, status)}
            dot={dot}
            action={
              owner ? (
                <View style={{ flexDirection: 'row', gap: V.table.rowGap }}>
                  {state === 'private' ? (
                    <Round
                      icon="list"
                      side={strip.round}
                      iconSize={strip.roundIcon}
                      color={look.accent}
                      label={tr.venue.openLobby}
                      disabled={full}
                      onPress={onOpenLobby}
                    />
                  ) : (
                    <Round
                      icon="close"
                      side={strip.round}
                      iconSize={strip.roundIcon}
                      color={look.accent}
                      label={tr.venue.withdraw}
                      loading={withdraw.isPending}
                      onPress={() => withdraw.mutate()}
                    />
                  )}
                  <Round
                    icon="invite"
                    side={strip.round}
                    iconSize={strip.roundIcon}
                    color={look.accent}
                    label={tr.venue.invite}
                    disabled={full}
                    onPress={openInvite}
                  />
                </View>
              ) : null
            }
          />
        </Tap>
      }
    >
      <View style={{ padding: V.table.inset, paddingBottom: owner ? 0 : V.table.inset }}>
        <Tap
          testID="go-to-table"
          sink={false}
          accessibilityLabel={tr.venue.tableHead(room.name ?? '', room.phones, status)}
          onPress={openTable}
          style={{
            minHeight: V.table.minHeight,
            borderRadius: V.table.radius,
            borderWidth: V.table.edge,
            borderColor: look.frame,
            overflow: 'hidden',
            padding: V.table.pad,
            paddingTop: V.table.padTop,
            justifyContent: 'flex-end',
          }}
        >
          <PictureGround picture={picture} />
          <View
            style={{ position: 'absolute', top: V.table.status.inset, right: V.table.status.inset }}
          >
            <StatusTag label={status} dot={dot} />
          </View>
          {/* The panel on the picture's foot (`.ip`), drawn: no live blur in a card (2.2). */}
          <View
            style={{
              borderRadius: P.radius,
              borderWidth: P.edge,
              borderColor: look.frame,
              backgroundColor: look.panel.fill,
              boxShadow: look.panel.shadow || undefined,
              paddingHorizontal: P.padX,
              paddingVertical: P.padY,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: V.table.rowGap }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="venueCardTitle" ink testID="table-name" fit lines={2}>
                  {room.name ?? ''}
                </T>
              </View>
              <T v="venueCount" color={look.sentence} tabular>
                {count}
              </T>
            </View>
            <View style={{ marginTop: P.facesTop }}>
              <Seats roomId={room.id} phones={room.phones} me={checkIn.id} />
            </View>
            <View testID="table-state">
              <View style={{ marginTop: P.meterTop }}>
                <Meter phones={room.phones} />
              </View>
              <View style={{ marginTop: P.noteTop }}>
                <T v="fine" color={look.sentence} testID={full ? 'table-full' : undefined}>
                  {full
                    ? tr.venue.seatsFull
                    : room.phones <= 1
                      ? tr.venue.seatsAlone
                      : tr.venue.seated(room.phones)}
                </T>
              </View>
            </View>
            {live && (intent || tag) ? (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: KIT.size.chipGap,
                  marginTop: P.noteTop,
                }}
              >
                {intent ? (
                  <Tag tone={intent === 'game' ? 'purple' : 'pink'} label={tr.intents[intent]} />
                ) : null}
                {tag ? <Tag label={tr.concepts[tag]} /> : null}
              </View>
            ) : null}
          </View>
        </Tap>
      </View>

      {owner ? (
        <View style={{ padding: B.pad, flexDirection: 'row', gap: B.gap }}>
          {state === 'private' ? (
            <Btn
              variant="glassy"
              sm
              icon="list"
              testID="lobby-open"
              label={tr.venue.openLobby}
              disabled={full}
              onPress={onOpenLobby}
              look={buttonLook}
              style={EQUAL}
            />
          ) : (
            <Btn
              variant="glassy"
              sm
              icon="close"
              testID="withdraw-table"
              label={tr.venue.withdraw}
              onPress={() => withdraw.mutate()}
              loading={withdraw.isPending}
              look={buttonLook}
              style={EQUAL}
            />
          )}
          <Btn
            variant="glassy"
            sm
            icon="invite"
            testID="invite-open"
            label={tr.venue.invite}
            disabled={full}
            onPress={openInvite}
            look={buttonLook}
            style={EQUAL}
          />
        </View>
      ) : null}

      {withdraw.error ? (
        <View style={{ paddingHorizontal: B.pad, paddingBottom: B.pad }}>
          <T v="fine" color={KIT.danger}>
            {errorMessage(withdraw.error)}
          </T>
        </View>
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

// A table's square picture in its edge (the strip's and the lobby's rows, MekanKaydir `.mth`,
// `.oth`).
export function TableThumb({
  picture,
  size,
  radius,
  edge,
}: {
  picture: ImageSourcePropType | undefined;
  size: number;
  radius: number;
  edge: number;
}) {
  const { scheme } = useKit();
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <PictureGround picture={picture} />
      <View
        pointerEvents="none"
        style={[
          PICTURE_FILL,
          { borderRadius: radius, borderWidth: edge, borderColor: V[scheme].frame },
        ]}
      />
    </View>
  );
}

// A state's dot (7) before its words.
function Dot({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  );
}

// The state at the picture's corner (`.sc`): a white pill with its dot and its shadow, drawn (no
// live blur in a card, 2.2).
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
        boxShadow: V[scheme].status.shadow,
        flexDirection: 'row',
        alignItems: 'center',
        gap: s.gap,
      }}
    >
      <Dot color={dot} size={s.dot} />
      <T v="bucket" color={V[scheme].status.ink}>
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

// The strip the card folds into (72, MekanKaydir `.mc`): its square picture in its edge, the name,
// the count with the state, and the owner's rounds (or the small "Masa kur").
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
  return (
    <View
      style={{
        height: fold.tableStrip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.gap,
        paddingLeft: S.padLeft,
        paddingRight: S.padRight,
      }}
    >
      <TableThumb picture={picture} size={fold.stripPicture} radius={S.radius} edge={S.edge} />
      <View style={{ flex: 1, minWidth: 0, gap: S.lineGap }}>
        <T v="mapName" ink lines={1} fit>
          {name}
        </T>
        {status ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.faceGap }}>
            {dot ? <Dot color={dot} size={V.table.status.dot} /> : null}
            <T v="fine" color={V[scheme].stripSub}>
              {status}
            </T>
          </View>
        ) : null}
      </View>
      {action}
    </View>
  );
}

// No table yet (MekanMasaYok `.yk`): the riso picture on the card's width, under it the words,
// "Masa kur" and "Açık masalar" (down to the lobby) side by side.
const NO_TABLE_SCENE = require('../../../assets/riso/venue-no-table.webp');
function NoTable({ onCreate, onShowLobby }: { onCreate: () => void; onShowLobby: () => void }) {
  const N = V.none;
  const look: BtnLook = { type: 'holdRow', padLeft: N.buttonPadX, padRight: N.buttonPadX };
  return (
    <View testID="no-table">
      <Picture
        source={NO_TABLE_SCENE}
        accessible={false}
        contentFit="cover"
        style={{ width: '100%', height: N.picture }}
      />
      <View style={{ paddingTop: N.padTop, paddingHorizontal: N.padX, paddingBottom: N.padBottom }}>
        <T v="venueCardTitle" ink>
          {tr.venue.noTable}
        </T>
        <View style={{ marginTop: N.noteTop }}>
          <T v="note">{tr.venue.noTableHint}</T>
        </View>
        <View style={{ flexDirection: 'row', gap: N.gap, marginTop: N.buttonsTop }}>
          <Btn
            icon="plus"
            testID="table-create-open"
            label={tr.venue.createTable}
            onPress={onCreate}
            look={look}
            style={EQUAL}
          />
          <Btn
            variant="glassy"
            testID="no-table-lobby"
            label={tr.lobby.openTitle}
            onPress={onShowLobby}
            look={look}
            style={EQUAL}
          />
        </View>
      </View>
    </View>
  );
}
