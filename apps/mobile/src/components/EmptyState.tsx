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

export type { StateKind };

type Props = {
  // Aura v65 §6 (U36): `empty` the still sign (or a riso picture), `loading` the meeting capsules
  // (Buluş; 300 ms in, at least 600 ms with `useLoaderHold`), `error` and `offline` cloudOff in a
  // soft disc. Or an icon in the same disc.
  kind?: StateKind;
  icon?: IconName;
  title?: string;
  body: string;
  // `loading`: the action is running (a retry reloading); the button waits and takes no second
  // press.
  action?: { label: string; onPress: () => void; loading?: boolean };
  // The lobby's smaller empty state (docs/design/aura → Mekan: 18 / 14, 18 above).
  small?: boolean;
  // The empty state's riso picture in place of the still sign (Aura v65 §9.1).
  picture?: { source: ImageSourcePropType; width: number; height: number; radius: number };
  // Every empty state's riso picture (the owner's call, 2 Kasım, 9.1; Aura v76 BosDurumlar).
  riso?: EmptyRiso;
  // In a card or a sheet: the small picture (160x110, 22 round, the raised shadow) rather than the
  // screen's (240x165, 28 round, the card shadow).
  compact?: boolean;
  // Under a page's own heading and switch (Aura v75 AktivitelerHal): the loader 12 over `fine`
  // words; the error's icon 28 and its words in the text colour, "Tekrar dene" with its refresh.
  inPage?: boolean;
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
} as const satisfies Record<string, ImageSourcePropType>;
export type EmptyRiso = keyof typeof EMPTY_RISO;
const RISO_FULL = { width: 240, height: 165, radius: 28, shadow: 'card' } as const;
const RISO_SMALL = { width: 160, height: 110, radius: 22, shadow: 'raised' } as const;

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
// "Tekrar dene" btn sm soft.
export function EmptyState({
  kind,
  icon,
  title,
  body,
  action,
  small,
  picture,
  riso,
  compact,
  inPage,
}: Props) {
  if (kind === 'empty')
    return (
      <Empty
        title={title}
        body={body}
        action={action}
        small={small || compact}
        risoId={riso}
        picture={
          riso ? { source: EMPTY_RISO[riso], ...(compact ? RISO_SMALL : RISO_FULL) } : picture
        }
      />
    );
  if (kind === 'loading') return <Loading body={body} inPage={inPage} />;

  const glyph: IconName =
    kind === 'error' || kind === 'offline' ? 'cloudOff' : (icon ?? 'cloudOff');
  return (
    <View
      className="items-center"
      style={{
        gap: KIT.size.stateGap,
        paddingTop: inPage ? 0 : SPACING[2],
        paddingBottom: SPACING[1],
        paddingHorizontal: inPage ? SPACING[3] : SPACING[4],
      }}
    >
      <StateDisc icon={glyph} iconSize={inPage ? KIT.size.stateIconPage : KIT.size.stateIcon} />
      <View className="items-center self-stretch" style={{ gap: SPACING[1] }}>
        {title ? (
          <T v="h3" center accessibilityRole="header">
            {title}
          </T>
        ) : null}
        <T v="body" center ink={inPage}>
          {body}
        </T>
      </View>
      {action ? (
        <Btn
          variant="glassy"
          sm
          icon={inPage ? 'refresh' : undefined}
          label={action.label}
          onPress={action.onPress}
          loading={action.loading}
        />
      ) : null}
    </View>
  );
}

// MekanYukleniyor: the meeting capsules 40, 18 above; GaleriProfil: "Yükleniyor…" under them. The
// whole state waits 300 ms, so a quick answer shows nothing.
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
        gap: inPage ? KIT.size.stateGap : KIT.size.stateLoadGap,
        paddingTop: inPage ? 0 : KIT.size.stateLoadTop,
        opacity: shown ? 1 : 0,
      }}
    >
      <Loader kind="meet" size={KIT.size.stateLoader} label={null} delay={0} />
      <T v={inPage ? 'fine' : 'body'} center>
        {body}
      </T>
    </View>
  );
}

// The empty state (docs/design/aura, aura 31): the still sign, the title and the note centred,
// on the screen without a card; at most one action under them.
function Empty({
  title,
  body,
  action,
  small,
  picture,
  risoId,
}: Pick<Props, 'title' | 'body' | 'action' | 'small'> & {
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
        // U15 (AktivitelerBos `.empty`): 8 apart, 12 in from the sides.
        gap: SPACING[2],
        paddingTop: small ? KIT.size.emptyTopSm : KIT.size.emptyTop,
        paddingHorizontal: SPACING[3],
      }}
    >
      {picture ? (
        // AktivitelerBos `.empty img`: the board's shadow, 16 under it (the column's 8 and 8 more).
        <View
          style={{ marginBottom: SPACING[2] }}
          testID={risoId ? `empty-riso-${risoId}` : undefined}
        >
          <RisoPicture {...picture} />
        </View>
      ) : (
        <EmptyMark />
      )}
      {title ? (
        <T v="h3" center accessibilityRole="header" style={{ marginTop: KIT.size.emptyTitleTop }}>
          {title}
        </T>
      ) : null}
      <T
        v="body"
        strong={!title}
        center
        style={title ? null : { marginTop: KIT.size.emptyTitleTop }}
      >
        {body}
      </T>
      {action ? (
        <View style={{ marginTop: SPACING[3] }}>
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
