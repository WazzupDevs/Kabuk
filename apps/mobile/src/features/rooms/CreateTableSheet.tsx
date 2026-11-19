import { type Concept, type Intent } from '@shared/rooms.ts';
import { TABLE_ICON_THEMES, TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, Chip, Round, Switch, T, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { useProfile } from '@/features/account/useProfile';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { Tap } from '@/motion/Tap';
import { KIT } from '@/theme/auraKit';
import { TABLE_SETUP } from '@/theme/tableSetup';

import { CreateLobbyChoices } from './LobbyChoices';
import { roomKeys } from './queries';
import {
  TABLE_ICON_RADIUS_SHARE,
  TABLE_ICON_SIZE,
  TABLE_ICON_TAKEN_OPACITY,
  TableIcon,
  tableIconName,
} from './TableIcon';
import { TABLE_CARD_WIDE, TABLE_ICON_IMAGES } from './tableIconImages';

type Props = {
  onClose: () => void;
  venueId: string;
  // The venue's name under the title (MasaKur `.mksub`): the person's own check-in.
  venueName: string;
  // Icons of the venue's other open and running tables: shown faded and not chosen (K-45).
  usedIcons: ReadonlySet<string>;
  // Whether the person sits anonymously: the check-in's identity, and for a man and "Belirtmek
  // istemiyorum" always the profile (docs/SPEC_V4.md §4.D; @shared/gender.ts → seatsAnonymously).
  anonymous: boolean;
};

const S = TABLE_SETUP;
const QUICK = 4;

// "Masa kur" (yeni arayüz tuvali: MasaKur 32a, MasaKurLobi 32b, MasaKurGorsel 32c; docs/SPEC_V4.md
// §4.E): the sheet from 60 under the screen's top; the chosen picture with its name and
// "Rastgele", four free pictures and "Tümüne bak" (Masa görseli, a page inside the sheet), whether
// the table goes into the lobby (with the intent and game tag then: the picture shorter), the name
// the person sits with and "Masayı kur" fixed at the foot.
// The table is called by its icon (K-76); the server checks the icon, and an icon taken meanwhile
// is swapped for a free one. Then the table opens.
export function CreateTableSheet({ onClose, venueId, venueName, usedIcons, anonymous }: Props) {
  const queryClient = useQueryClient();
  const k = useKit();
  const profile = useProfile();
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const free = useMemo(() => TABLE_ICONS.filter((i) => !usedIcons.has(i.id)), [usedIcons]);
  // One of the free pictures comes first, at random: "Rastgele · ÖNERİ" until one is picked.
  const [icon, setIcon] = useState<string | null>(
    () => free[Math.floor(Math.random() * free.length)]?.id ?? null,
  );
  const [suggested, setSuggested] = useState(true);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(
    () => TABLE_ICONS.find((i) => i.id === icon)?.theme ?? TABLE_ICON_THEMES[0] ?? '',
  );
  const [lobby, setLobby] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [tag, setTag] = useState<Concept | null>(null);

  const create = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () =>
      roomsApi.create({
        open: lobby,
        ...(icon ? { icon } : {}),
        ...(lobby && intent ? { intent } : {}),
        ...(lobby && tag ? { gameTag: tag } : {}),
      }),
    onSuccess: async ({ roomId }) => {
      haptic('tableOpened');
      track('table_created', {});
      if (lobby) track('table_opened', { intent: intent ?? 'none', game_tag: tag ?? 'none' });
      void registerForPush();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.current }),
        queryClient.invalidateQueries({ queryKey: roomKeys.venueTables(venueId) }),
      ]);
      onClose();
      router.push({ pathname: '/room/[id]', params: { id: roomId } });
    },
  });

  const name = anonymous ? photo.nick : (profile.data?.display_name ?? '');

  // The quick row: the chosen picture and three more free ones of its theme (MasaKur `.thr`).
  const quick = useMemo(() => {
    const same = free.filter((i) => i.id !== icon && i.theme === theme).slice(0, QUICK - 1);
    return [...(icon ? [icon] : []), ...same.map((i) => i.id)];
  }, [free, icon, theme]);
  const shuffle = () => {
    const others = free.filter((i) => i.id !== icon);
    const next = others[Math.floor(Math.random() * others.length)];
    if (!next) return;
    setIcon(next.id);
    setTheme(next.theme);
    setSuggested(true);
  };
  const openPicker = () => {
    setDraft(icon);
    setPicking(true);
  };
  const closePicker = () => setPicking(false);

  if (picking) {
    return (
      <Sheet
        visible
        // Back, a tap outside and a pull down go back to Masa kur (the page inside the sheet).
        onClose={closePicker}
        title={tr.createTable.picture}
        titleType="pageBarTitle"
        subtitle={tr.createTable.pictureCount(TABLE_ICONS.length)}
        lead={
          <Round
            icon="back"
            testID="table-icon-pick"
            label={tr.common.back}
            onPress={closePicker}
          />
        }
        top={S.sheetTop}
        footer={
          <Btn
            block

            testID="table-icon-confirm"
            label={tr.createTable.pick}
            disabled={!draft}
            onPress={() => {
              if (draft) {
                setIcon(draft);
                setSuggested(false);
              }
              closePicker();
            }}
          />
        }
      >
        <PictureGrid
          theme={theme}
          onTheme={setTheme}
          selected={draft}
          used={usedIcons}
          onSelect={setDraft}
        />
      </Sheet>
    );
  }

  const line = { borderTopWidth: KIT.size.hair, borderTopColor: S.row.line[k.scheme] };
  const rowPad = lobby ? S.row.padYLobby : S.row.padY;
  return (
    <Sheet
      visible
      onClose={onClose}
      title={tr.createTable.title}
      titleType="pageBarTitle"
      subtitle={venueName || undefined}
      top={S.sheetTop}
      footer={
        // "Masayı kur" stays at the foot, the notes right above it; only the content above
        // scrolls, and only when it does not fit.
        <View style={{ gap: KIT.size.rowGap }}>
          {/* With the profile and no visible photo the server refuses (photo_required): said
              before the press, not after. */}
          {!anonymous && photo.known && !photo.has ? (
            <T v="fine" color={k.c.warn}>
              {tr.errors.photo_required}
            </T>
          ) : null}
          {create.isError ? (
            <T v="fine" color={k.c.warn} accessibilityLiveRegion="polite">
              {errorMessage(create.error)}
            </T>
          ) : null}
          <Btn
            block

            icon="plus"
            testID="table-create"
            label={tr.createTable.confirm}
            onPress={() => create.mutate()}
            loading={create.isPending}
          />
        </View>
      }
    >
      <View>
        {/* The chosen picture (`.pvw`), its name at the bottom left, "Rastgele" at the top right. */}
        <View
          style={{
            marginTop: S.preview.top - KIT.size.rowGap,
            height: lobby ? S.preview.heightLobby : S.preview.height,
            borderRadius: S.preview.radius,
            overflow: 'hidden',
            backgroundColor: k.c.infoRow,
          }}
        >
          <Picture id={icon} />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: S.preview.radius,
                borderWidth: S.preview.edge,
                borderColor: S.preview.edgeColor,
              },
            ]}
          />
          <View
            testID="table-name-preview"
            accessible
            accessibilityLabel={tableIconName(icon) ?? ''}
            style={{
              position: 'absolute',
              left: S.preview.inset,
              bottom: S.preview.inset,
              right: S.preview.inset,
              alignItems: 'flex-start',
            }}
          >
            <View style={PILL}>
              <T v="setupPill" color={S.preview.pill.ink}>
                {tableIconName(icon) ?? ''}
              </T>
            </View>
          </View>
          <Tap
            testID="table-icon-shuffle"
            accessibilityLabel={tr.createTable.shuffleLabel}
            feel="selection"
            disabled={free.length < 2}
            onPress={shuffle}
            style={{
              position: 'absolute',
              top: S.preview.inset,
              right: S.preview.inset,
              height: S.preview.shuffle.height,
              borderRadius: S.preview.shuffle.height / 2,
              paddingLeft: S.preview.shuffle.padLeft,
              paddingRight: S.preview.shuffle.padRight,
              flexDirection: 'row',
              alignItems: 'center',
              gap: S.preview.shuffle.gap,
              backgroundColor: S.preview.pill.ground,
            }}
          >
            <CapIcon name="shuffle" color={S.preview.pill.ink} size={S.preview.shuffle.icon} />
            <T v="setupShuffle" color={S.preview.pill.ink}>
              {tr.createTable.shuffle}
            </T>
            {suggested ? (
              <View
                style={{
                  marginLeft: S.preview.badge.gap,
                  paddingVertical: S.preview.badge.padY,
                  paddingHorizontal: S.preview.badge.padX,
                  borderRadius: KIT.size.btn,
                  backgroundColor: S.preview.badge[k.scheme],
                }}
              >
                <T v="setupBadge" color={k.c.link}>
                  {tr.createTable.suggested}
                </T>
              </View>
            ) : null}
          </Tap>
        </View>

        {/* "Masa görseli · Tümüne bak" (`.sch`). */}
        <View
          style={{
            marginTop: lobby ? S.head.topLobby : S.head.top,
            marginBottom: S.head.bottom,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: KIT.size.rowGap,
          }}
        >
          <T v="setupHead" style={{ flexShrink: 1 }}>
            {tr.createTable.picture}
          </T>
          <Tap
            testID="table-icon-pick"
            accessibilityLabel={tr.createTable.iconLabel}
            accessibilityState={{ expanded: false }}
            onPress={openPicker}
            hitSlop={KIT.size.chipsGap}
            style={{ flexDirection: 'row', alignItems: 'center', gap: S.head.linkGap }}
          >
            <T v="kesfetChip" ink>
              {tr.createTable.seeAll}
            </T>
            <CapIcon name="chevron" color={k.c.ink} size={S.head.chevron} />
          </Tap>
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={tr.createTable.picture}
          style={{ flexDirection: 'row', gap: S.thumb.gap }}
        >
          {quick.map((id) => (
            <View key={id} style={{ flex: 1 }}>
              <Tile
                id={id}
                on={id === icon}
                taken={false}
                onPress={() => {
                  setIcon(id);
                  setSuggested(false);
                }}
              />
            </View>
          ))}
          {/* Fewer free pictures than the row holds: the row keeps its size. */}
          {Array.from({ length: Math.max(0, QUICK - quick.length) }, (_, i) => (
            <View key={`gap-${i}`} style={{ flex: 1 }} />
          ))}
        </View>

        {/* "Lobide görünsün": the whole row is the switch (`.row2`). */}
        <Tap
          testID="table-lobby"
          accessibilityRole="switch"
          accessibilityLabel={tr.createTable.lobby}
          accessibilityState={{ checked: lobby }}
          feel="selection"
          sink={false}
          onPress={() => setLobby((v) => !v)}
          style={{
            ...line,
            marginTop: lobby ? S.row.topLobby : S.row.top,
            paddingVertical: rowPad,
            flexDirection: 'row',
            alignItems: 'center',
            gap: S.row.gap,
          }}
        >
          <View style={{ flex: 1, gap: S.row.textGap }}>
            <T v="settingsRow">{tr.createTable.lobby}</T>
            <T v="fine">{tr.createTable.lobbyHint}</T>
          </View>
          <Switch on={lobby} />
        </Tap>

        {lobby ? (
          <CreateLobbyChoices intent={intent} tag={tag} onIntent={setIntent} onTag={setTag} />
        ) : null}

        {/* How the person sits at the table: the capsule and nick, or the photo and name. */}
        <View
          style={{
            ...line,
            marginTop: lobby ? S.row.topLobby : 0,
            paddingVertical: rowPad,
            flexDirection: 'row',
            alignItems: 'center',
            gap: S.row.gap,
          }}
        >
          {anonymous && look ? (
            <Av size="list" name={name}>
              <LookAvatar look={look} size={KIT.size.av.list} />
            </Av>
          ) : (
            <Av size="list" name={name} photoUrl={anonymous ? null : photo.url} />
          )}
          <View style={{ flex: 1, gap: S.row.textGap }}>
            <T v="settingsRow">{tr.createTable.seatAs(name)}</T>
            <T v="fine">{anonymous ? tr.createTable.seatAnonymous : tr.createTable.seatProfile}</T>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

const PILL = {
  height: S.preview.pill.height,
  paddingHorizontal: S.preview.pill.padX,
  borderRadius: S.preview.pill.height / 2,
  justifyContent: 'center' as const,
  backgroundColor: S.preview.pill.ground,
};

// A table's picture filling its frame: the wide card, else the square one.
function Picture({ id, faded }: { id: string | null; faded?: boolean }) {
  const source: ImageSourcePropType | undefined = id
    ? (TABLE_CARD_WIDE[id] ?? TABLE_ICON_IMAGES[id])
    : undefined;
  if (!source) return null;
  return (
    <Image
      source={source}
      fadeDuration={0}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { opacity: faded ? S.thumb.taken : 1 }]}
    />
  );
}

// A picture to choose (`.th`): 3:2, its ink edge; the chosen one in the primary outline; one at
// another table faded with "Başka masada" (`.tkt`) and not pressed.
function Tile({
  id,
  on,
  taken,
  onPress,
}: {
  id: string;
  on: boolean;
  taken: boolean;
  onPress: () => void;
}) {
  const { scheme } = useKit();
  const label = tableIconName(id) ?? '';
  const out = S.thumb.ring + S.thumb.ringOff;
  return (
    <Tap
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled: taken }}
      accessibilityLabel={taken ? tr.createTable.iconTaken(label) : label}
      disabled={taken}
      feel="selection"
      onPress={onPress}
      style={{ aspectRatio: S.thumb.ratio }}
    >
      {on ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -out,
            left: -out,
            right: -out,
            bottom: -out,
            borderRadius: S.thumb.radius + out,
            borderWidth: S.thumb.ring,
            borderColor: S.thumb.ringColor[scheme],
          }}
        />
      ) : null}
      <View style={{ flex: 1, borderRadius: S.thumb.radius, overflow: 'hidden' }}>
        <Picture id={id} faded={taken} />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: S.thumb.radius,
              borderWidth: S.thumb.edge,
              borderColor: S.thumb.edgeColor,
            },
          ]}
        />
        {taken ? (
          <View
            style={{
              position: 'absolute',
              left: S.grid.tag.inset,
              top: S.grid.tag.inset,
              height: S.grid.tag.height,
              paddingHorizontal: S.grid.tag.padX,
              borderRadius: S.grid.tag.height / 2,
              justifyContent: 'center',
              backgroundColor: S.grid.tag.ground,
            }}
          >
            <T v="setupTaken" color={S.grid.tag.ink}>
              {tr.createTable.taken}
            </T>
          </View>
        ) : null}
      </View>
    </Tap>
  );
}

// Masa görseli (MasaKurGorsel 32c): every picture in two columns, its name under it, the chosen one
// checked; the ones at the venue's other tables faded. Themes only when the list has them.
function PictureGrid({
  theme,
  onTheme,
  selected,
  used,
  onSelect,
}: {
  theme: string;
  onTheme: (theme: string) => void;
  selected: string | null;
  used: ReadonlySet<string>;
  onSelect: (icon: string) => void;
}) {
  const k = useKit();
  const [width, setWidth] = useState(0);
  const themed = TABLE_ICON_THEMES.length > 1;
  const scenes = themed ? TABLE_ICONS.filter((i) => i.theme === theme) : TABLE_ICONS;
  const cell = width > 0 ? (width - S.grid.colGap) / 2 : 0;
  const check = S.grid[k.scheme];
  return (
    <View style={{ marginTop: S.grid.top - KIT.size.rowGap, gap: KIT.size.chipsGap }}>
      {themed ? (
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}
        >
          {TABLE_ICON_THEMES.map((t) => (
            <Chip
              key={t}
              label={t}
              on={t === theme}
              onPress={() => {
                if (t !== theme) haptic('selection');
                onTheme(t);
              }}
            />
          ))}
        </View>
      ) : null}
      <View
        testID="table-icon-picker"
        accessibilityRole="radiogroup"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: S.grid.colGap,
          rowGap: S.grid.rowGap,
        }}
      >
        {cell > 0
          ? scenes.map((scene) => {
              const on = scene.id === selected;
              const taken = used.has(scene.id) && !on;
              return (
                <View key={scene.id} style={{ width: cell }}>
                  <Tile id={scene.id} on={on} taken={taken} onPress={() => onSelect(scene.id)} />
                  <View
                    style={{
                      marginTop: S.grid.nameTop,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: S.grid.nameGap,
                    }}
                  >
                    <T v="kesfetChip" color={taken ? k.c.muted : k.c.ink} style={{ flexShrink: 1 }}>
                      {scene.name}
                    </T>
                    {on ? (
                      <View
                        style={{
                          width: S.grid.check,
                          height: S.grid.check,
                          borderRadius: S.grid.check / 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: check.check,
                        }}
                      >
                        <CapIcon name="check" color={check.onCheck} size={S.grid.checkIcon} />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          : null}
      </View>
    </View>
  );
}

const OUTLINE = 3;
const PICKER_GAP = 8;

// The owner's "Masa simgesi" (TableIconSheet: MasaSimgeDegistir; K-45, K-59): the themes, the
// theme's scenes, the ones at the venue's other tables faded.
export function IconPicker({
  theme,
  onTheme,
  selected,
  used,
  onSelect,
}: {
  theme: string;
  onTheme: (theme: string) => void;
  selected: string | null;
  used: ReadonlySet<string>;
  onSelect: (icon: string) => void;
}) {
  const scenes = TABLE_ICONS.filter((i) => i.theme === theme);
  // aura v47 (MasaKurSimge): the scenes as tiles 8 apart, the chosen one in an outline. The riso
  // cards are one list (docs/decisions/masa-kimligi-riso.md): the theme row shows only when the
  // list has themes.
  return (
    <View style={{ gap: KIT.size.chipsGap }} testID="table-icon-picker">
      {TABLE_ICON_THEMES.length > 1 ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={tr.createTable.iconLabel}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipsGap }}
        >
          {TABLE_ICON_THEMES.map((t) => (
            <Chip
              key={t}
              label={t}
              on={t === theme}
              onPress={() => {
                if (t !== theme) haptic('selection');
                onTheme(t);
              }}
            />
          ))}
        </View>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: PICKER_GAP }}
      >
        {scenes.map((scene) => {
          const taken = used.has(scene.id) && scene.id !== selected;
          const on = scene.id === selected;
          return (
            <Tap
              key={scene.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: taken }}
              accessibilityLabel={taken ? tr.createTable.iconTaken(scene.name) : scene.name}
              disabled={taken}
              sink={false}
              onPress={() => onSelect(scene.id)}
              style={{
                opacity: taken ? TABLE_ICON_TAKEN_OPACITY : 1,
                borderRadius: TABLE_ICON_SIZE.picker * TABLE_ICON_RADIUS_SHARE + OUTLINE,
                borderWidth: OUTLINE,
                borderColor: on ? KIT.primary : 'transparent',
              }}
            >
              <TableIcon icon={scene.id} size="picker" />
            </Tap>
          );
        })}
      </View>
      <T v="fine">{tr.createTable.iconNote}</T>
    </View>
  );
}
