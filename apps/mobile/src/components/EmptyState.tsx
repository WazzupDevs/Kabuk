import { useEffect, useState } from 'react';
import { type ImageSourcePropType, View } from 'react-native';

import { LOADER_SHOW_AFTER_MS, type StateKind } from '@/theme/markMotion';
import { SPACING } from '@/theme/tokens';

import { type IconName } from './Button';
import { Loader } from './Loader';
import { AppIcon } from './AppIcon';
import { EmptyMark } from '@/aura/EmptyMark';
import { RisoPicture } from '@/aura/RisoPicture';
import { Btn, T, useKit } from '@/aura/kit';
import { shadowParts } from './NativeShadow';
import { useLabOff } from '@/lib/drawLab';
import { KIT } from '@/theme/auraKit';
import { isOfflineError } from '@/i18n/errors';
import { tr } from '@/i18n/tr';

export type { StateKind };

type Props = {
  // Aura v65 §6 (U36): `empty` the still sign (or a riso picture), `loading` the meeting capsules
  // (Buluş; 300 ms in, at least 600 ms with `useLoaderHold`), `error` and `offline` cloudOff in a
  // soft disc. Or an icon in the same disc.
  kind?: StateKind;
  icon?: IconName;
  title?: string;
  body: string;
  // `error`: the failure it stands for. Without a connection it is the offline state ("Bağlantı
  // yok", its own sentence and picture); otherwise its title "Bir sorun oldu" over `body`.
  error?: unknown;
  // `loading`: the action is running (a retry reloading); the button waits and takes no second
  // press.
  action?: { label: string; onPress: () => void; loading?: boolean };
  // The lobby's smaller empty state (docs/design/aura → Mekan: 18 / 14, 18 above).
  small?: boolean;
  // The empty state's riso picture in place of the still sign (Aura v65 §9.1).
  picture?: { source: ImageSourcePropType; width: number; height: number; radius: number };
  // Every empty state's riso picture (the owner's call, 2 Kasım, 9.1; Aura v76 BosDurumlar).
  riso?: EmptyRiso;
  // In a card or a sheet: the smaller picture (120 across rather than the screen's 150; both
  // unframed, yeni arayüz tuvali `.emp img`).
  compact?: boolean;
  // Under a page's own heading and switch (Aura v75 AktivitelerHal): the loader at the page's top;
  // the error's icon 28.
  inPage?: boolean;
  // Inside its own card that keeps the room around it (tuval DmBos `.demp .emp`): no room of its
  // own, the title 10 under the picture.
  inCard?: boolean;
};

// Aura v76 BosDurumlar (640x440 exports; the DM's first message and the venue's week reuse the
// history and events pictures).
const EMPTY_RISO = {
  chats: require('../../assets/riso/empty-chats.webp'),
  requests: require('../../assets/riso/empty-requests.webp'),
  notifications: require('../../assets/riso/empty-notifications.webp'),
  friends: require('../../assets/riso/empty-friends.webp'),
  history: require('../../assets/riso/empty-history.webp'),
  blocked: require('../../assets/riso/empty-blocked.webp'),
  muted: require('../../assets/riso/empty-muted.webp'),
  venues: require('../../assets/riso/empty-venues.webp'),
  chat: require('../../assets/riso/history-sohbet.webp'),
  events: require('../../assets/riso/empty-events.webp'),
  // Yeni arayüz tuvali (ArsivBos): the buddy looking out of the archive box, 360 × 294.
  archive: require('../../assets/riso/empty-archive.webp'),
  // Yeni arayüz tuvali (MesajlarBos, MesajlarAraBos, DmBos): cut out, no frame.
  messages: require('../../assets/riso/empty-messages.webp'),
  search: require('../../assets/riso/empty-search.webp'),
  dm: require('../../assets/riso/empty-dm.webp'),
} as const satisfies Record<string, ImageSourcePropType>;
export type EmptyRiso = keyof typeof EMPTY_RISO;
// Yeni arayüz tuvali (AktivitelerBos, boş hâl panoları 109–112 `.emp img`): small and unframed,
// no card, no shadow, no corner.
const RISO_FULL = {
  width: KIT.size.emptyRiso,
  height: Math.round(KIT.size.emptyRiso * KIT.size.emptyRisoAspect),
  radius: 0,
  shadow: 'none',
} as const;
const RISO_SMALL = {
  width: KIT.size.emptyRisoSm,
  height: Math.round(KIT.size.emptyRisoSm * KIT.size.emptyRisoAspect),
  radius: 0,
  shadow: 'none',
} as const;
// The new board's cut-out pictures (`.emp img`): 120 × 98 (the search's drawn 3:2 in that box),
// no corner, no shadow, at any size of the state.
const RISO_BOARD: Partial<
  Record<EmptyRiso, { width: number; height: number; radius: number; shadow: 'none' }>
> = {
  messages: { width: 120, height: 98, radius: 0, shadow: 'none' },
  search: { width: 120, height: 80, radius: 0, shadow: 'none' },
  dm: { width: 120, height: 98, radius: 0, shadow: 'none' },
  archive: { width: 120, height: 98, radius: 0, shadow: 'none' },
};

// AktivitelerHata and AktivitelerBaglantiYok `.emp img` (210 × 172): the buddy at the broken cup,
// the buddy with the unplugged cable. Offline is `kind="offline"`, or an `error` that is the
// connection's (isOfflineError).
const ERROR_RISO = {
  error: require('../../assets/riso/error-generic.webp'),
  offline: require('../../assets/riso/error-offline.webp'),
} as const satisfies Record<string, ImageSourcePropType>;

// GaleriKesfet, GaleriProfil `.disc`: 64 round, the soft fill and edge (`.btn.soft`), the icon 26
// muted.
function StateDisc({ icon, iconSize }: { icon: IconName; iconSize: number }) {
  const { c } = useKit();
  const side = KIT.size.stateDisc;
  const shadow = shadowParts(
    useLabOff('golge'),
    c.raisedShadow || undefined,
    undefined,
    side / 2,
    true,
    KIT.size.edge,
  );
  return (
    <View
      style={{
        width: side,
        height: side,
        borderRadius: side / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.raisedRound,
        borderWidth: KIT.size.edge,
        borderColor: c.raisedEdge,
        boxShadow: shadow.boxShadow,
      }}
    >
      {shadow.node}
      <AppIcon name={icon} size={iconSize} color={c.muted} />
    </View>
  );
}

// A screen's empty, error, offline or loading state (Aura v65 §6 "Türetme kuralları"), centred on
// the screen without a card: the disc (or the loader), the note under it and at most one action,
// "Tekrar dene" btn sm soft. Yeni arayüz tuvali (AktivitelerHata, AktivitelerBaglantiYok): the
// title 15/20 600 12 under the disc, the sentence 13/18 500 4 under it (at most 260 wide), the
// soft button 16 under it. The error and offline states draw the boards' riso picture (210 × 172);
// an icon state (no kind) keeps the soft disc.
export function EmptyState({
  kind,
  icon,
  title,
  body,
  error,
  action,
  small,
  picture,
  riso,
  compact,
  inPage,
  inCard,
}: Props) {
  if (kind === 'empty')
    return (
      <Empty
        title={title}
        body={body}
        action={action}
        small={small || compact}
        inCard={inCard}
        risoId={riso}
        picture={
          riso
            ? {
                source: EMPTY_RISO[riso],
                ...(RISO_BOARD[riso] ?? (compact ? RISO_SMALL : RISO_FULL)),
              }
            : picture
        }
      />
    );
  if (kind === 'loading') return <Loading body={body} inPage={inPage} />;

  const pictured = kind === 'error' || kind === 'offline';
  const offline =
    kind === 'offline' || (kind === 'error' && error !== undefined && isOfflineError(error));
  // Ortak kurallar C4: "Bağlantı yok" with its sentence; a failure "Bir sorun oldu" over the
  // screen's own words.
  const heading = offline
    ? tr.connection.offlineTitle
    : (title ?? (pictured ? tr.connection.errorTitle : undefined));
  const words = offline ? tr.connection.offlinePageBody : body;
  const glyph: IconName = icon ?? 'cloudOff';
  return (
    <View
      className="items-center"
      style={{
        justifyContent: 'center',
        paddingTop: inPage ? 0 : SPACING[2],
        paddingBottom: SPACING[1],
        paddingHorizontal: KIT.size.emptyPad,
      }}
    >
      {pictured ? (
        <View testID={offline ? 'error-riso-offline' : 'error-riso'} collapsable={false}>
          <RisoPicture
            source={offline ? ERROR_RISO.offline : ERROR_RISO.error}
            width={KIT.size.stateRisoW}
            height={KIT.size.stateRisoH}
            radius={0}
            shadow="none"
          />
        </View>
      ) : (
        <StateDisc icon={glyph} iconSize={inPage ? KIT.size.stateIconPage : KIT.size.stateIcon} />
      )}
      <StateWords title={heading} body={words} />
      {action ? (
        <Btn
          variant="glassy"
          sm
          label={action.label}
          onPress={action.onPress}
          loading={action.loading}
          // Under the centred words, not at the left edge (audit M15-21).
          style={{ alignSelf: 'center', marginTop: KIT.size.emptyActionTop }}
        />
      ) : null}
    </View>
  );
}

// `.et` and `.ed`: the title 12 under the picture, the sentence 4 under it, at most 260 wide; a
// sentence alone stands in the title's place, in the text colour.
function StateWords({
  title,
  body,
  titleTop = KIT.size.emptyTitleTop,
}: {
  title?: string;
  body: string;
  titleTop?: number;
}) {
  return (
    <>
      {title ? (
        <T v="stateTitle" center accessibilityRole="header" style={{ marginTop: titleTop }}>
          {title}
        </T>
      ) : null}
      <T
        v="fine"
        ink={!title}
        center
        style={{
          marginTop: title ? KIT.size.emptyNoteTop : KIT.size.emptyTitleTop,
          maxWidth: KIT.size.emptyNoteMax,
        }}
      >
        {body}
      </T>
    </>
  );
}

// YukleniyorListe, YukleniyorProfil, YukleniyorSohbet (OrtakKurallar C3): the meeting capsules
// alone in the content's middle, no words and no skeleton lines; screen readers say "Yükleniyor…".
// It fills what it stands in (a Screen's part, Screen → fills) and centres the mark there; where
// nothing gives it room it keeps `stateLoadTop` over and under. The whole state waits 300 ms, so a
// quick answer shows nothing.
function Loading({ body, inPage }: { body: string; inPage?: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), LOADER_SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <View
      className="items-center"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={body}
      style={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: inPage ? 0 : KIT.size.stateLoadTop,
        opacity: shown ? 1 : 0,
      }}
    >
      <Loader kind="meet" size={KIT.size.stateLoader} label={null} delay={0} />
    </View>
  );
}

// The empty state (yeni arayüz tuvali AktivitelerBos `.emp`): the small unframed riso picture (or
// the still sign), the title and the note centred, on the screen without a card; at most one
// action under them.
function Empty({
  title,
  body,
  action,
  small,
  picture,
  risoId,
  inCard,
}: Pick<Props, 'title' | 'body' | 'action' | 'small' | 'inCard'> & {
  // The riso picture's name: its wrapper's testID (`empty-riso-<ad>`, E2E K14).
  risoId?: EmptyRiso;
  picture?: {
    source: ImageSourcePropType;
    width: number;
    height: number;
    radius: number;
    shadow?: 'card' | 'raised' | 'none';
  };
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: inCard ? 0 : small ? KIT.size.emptyTopSm : KIT.size.emptyTop,
        paddingHorizontal: inCard ? 0 : KIT.size.emptyPad,
      }}
    >
      {picture ? (
        <View testID={risoId ? `empty-riso-${risoId}` : undefined} collapsable={false}>
          <RisoPicture {...picture} />
        </View>
      ) : (
        <EmptyMark />
      )}
      <StateWords
        title={title}
        body={body}
        titleTop={inCard ? KIT.size.emptyTitleTopCard : undefined}
      />
      {action ? (
        <View style={{ marginTop: KIT.size.emptyActionTop }}>
          <Btn
            variant="glassy"
            label={action.label}
            onPress={action.onPress}
            loading={action.loading}
          />
        </View>
      ) : null}
    </View>
  );
}
