import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { TABLE_ICON_THEMES, TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Av, Btn, Chip, Glass, T, Tag } from '@/aura/kit';
import { Gathering, SceneGround } from '@/aura/Scene';
import { Chips } from '@/components/Chips';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
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
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { roomKeys } from './queries';
import {
  TABLE_ICON_RADIUS_SHARE,
  TABLE_ICON_SIZE,
  TABLE_ICON_TAKEN_OPACITY,
  TableIcon,
  tableIconName,
} from './TableIcon';
import { TABLE_ICON_IMAGES } from './tableIconImages';


type Props = {
  onClose: () => void;
  venueId: string;
  // Icons of the venue's other open and running tables: shown faded and not chosen (K-45).
  usedIcons: ReadonlySet<string>;
  // Whether the person sits anonymously: the check-in's identity, and for a man and "Belirtmek
  // istemiyorum" always the profile (docs/SPEC_V4.md §4.D; @shared/gender.ts → seatsAnonymously).
  anonymous: boolean;
};

// "Masa kur" (v46 data-kur; docs/SPEC_V4.md §4.E): the table's icon (one of the free scenes,
// changed with the picker), whether it goes into the lobby (with the intent and game tag then), and
// the name the person sits with. The table is called by its icon (K-76); the server checks the
// icon, and an icon taken meanwhile is swapped for a free one. Then the table opens.
export function CreateTableSheet({ onClose, venueId, usedIcons, anonymous }: Props) {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const free = useMemo(() => TABLE_ICONS.filter((i) => !usedIcons.has(i.id)), [usedIcons]);
  // v46: one of the free scenes comes first, at random.
  const [icon, setIcon] = useState<string | null>(
    () => free[Math.floor(Math.random() * free.length)]?.id ?? null,
  );
  const [picking, setPicking] = useState(false);
  const [theme, setTheme] = useState<string>(
    () => TABLE_ICONS.find((i) => i.id === icon)?.theme ?? TABLE_ICON_THEMES[0] ?? '',
  );
  const [lobby, setLobby] = useState(false);
  const [sceneWidth, setSceneWidth] = useState(0);
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

  // The quick row: the chosen picture and four more free ones of its theme (MasaKur).
  const quick = useMemo(() => {
    const same = free.filter((i) => i.id !== icon && i.theme === theme).slice(0, QUICK - 1);
    return [...(icon ? [icon] : []), ...same.map((i) => i.id)];
  }, [free, icon, theme]);
  const picture = icon ? TABLE_ICON_IMAGES[icon] : undefined;

  return (
    <Sheet visible onClose={onClose} title={tr.createTable.title}>
      {/* docs/design/aura → MasaKur: the chosen table as a scene, its name on a glass tag. */}
      <View
        onLayout={(e) => setSceneWidth(e.nativeEvent.layout.width)}
        style={{
          height: AURA.gatherings.create.height,
          borderRadius: AURA.scene.radius,
          overflow: 'hidden',
        }}
      >
        <SceneGround />
        {sceneWidth > 0 ? (
          <Gathering
            kind="create"
            width={sceneWidth}
            center={
              picture ? (
                <Image
                  source={picture}
                  fadeDuration={0}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : null
            }
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: KIT.size.rowGap,
            alignItems: 'center',
          }}
        >
          <View
            testID="table-name-preview"
            accessible
            accessibilityLabel={tableIconName(icon) ?? ''}
          >
            <Tag label={tableIconName(icon) ?? ''} height={NAME_TAG} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: QUICK_GAP }} accessibilityRole="radiogroup">
        {quick.map((id) => {
          const on = id === icon;
          const src = TABLE_ICON_IMAGES[id];
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={tableIconName(id) ?? ''}
              onPress={() => setIcon(id)}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: KIT.size.thumbRadius + OUTLINE,
                borderWidth: OUTLINE,
                borderColor: on ? KIT.primary : 'transparent',
                padding: OUTLINE - 1,
              }}
            >
              {src ? (
                <Image
                  source={src}
                  fadeDuration={0}
                  style={{ width: '100%', height: '100%', borderRadius: KIT.size.thumbRadius }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        testID="table-icon-pick"
        accessibilityRole="button"
        accessibilityState={{ expanded: picking }}
        accessibilityLabel={tr.createTable.iconLabel}
        onPress={() => setPicking((v) => !v)}
        hitSlop={KIT.size.chipsGap}
        style={{ alignSelf: 'flex-start' }}
      >
        <T v="fine" strong color={KIT.primary}>
          {picking ? tr.createTable.iconDone : tr.createTable.iconChange}
        </T>
      </Pressable>

      {picking ? (
        <IconPicker
          theme={theme}
          onTheme={setTheme}
          selected={icon}
          used={usedIcons}
          onSelect={setIcon}
        />
      ) : null}

      <Glass sm style={{ paddingVertical: KIT.size.chipsGap, paddingHorizontal: KIT.size.rowGap }}>
        <Toggle
          testID="table-lobby"
          label={tr.createTable.lobby}
          hint={tr.createTable.lobbyHint}
          value={lobby}
          onChange={setLobby}
        />
      </Glass>

      {lobby ? (
        <>
          <View style={{ gap: KIT.size.chipsGap }}>
            <T v="eyebrow">{tr.rooms.intentLabel}</T>
            <View style={CHIPS}>
              {(['none', ...INTENTS] as const).map((v) => (
                <Chip
                  key={v}
                  testID={`intent-${v}`}
                  label={v === 'none' ? tr.rooms.intentNone : tr.intents[v]}
                  on={(intent ?? 'none') === v}
                  onPress={() => setIntent(v === 'none' ? null : v)}
                />
              ))}
            </View>
          </View>
          <View style={{ gap: KIT.size.chipsGap }}>
            <T v="eyebrow">{tr.rooms.gameTagLabel}</T>
            <View style={CHIPS}>
              {(['none', ...CONCEPTS] as const).map((v) => (
                <Chip
                  key={v}
                  testID={`game-tag-${v}`}
                  label={v === 'none' ? tr.rooms.gameTagNone : tr.concepts[v]}
                  on={(tag ?? 'none') === v}
                  onPress={() => setTag(v === 'none' ? null : v)}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {/* How the person sits at the table: the capsule and nick, or the photo and name. */}
      <Glass
        sm
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: KIT.size.rowGap,
          paddingVertical: KIT.size.chipsGap + 2,
          paddingHorizontal: KIT.size.rowGap,
        }}
      >
        {anonymous && look ? (
          <Av size="sm" name={name}>
            <LookAvatar look={look} size={KIT.size.av.sm} />
          </Av>
        ) : (
          <Av size="sm" name={name} photoUrl={anonymous ? null : photo.url} />
        )}
        <T v="fine" style={{ flex: 1 }}>
          {tr.createTable.youAre(name)}
        </T>
      </Glass>
      {/* With the profile and no visible photo the server refuses (photo_required): said before
          the press, not after. */}
      {!anonymous && photo.known && !photo.has ? (
        <T v="fine" color={KIT.danger}>
          {tr.errors.photo_required}
        </T>
      ) : null}

      {create.isError ? (
        <T v="fine" color={KIT.danger} accessibilityLiveRegion="polite">
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
    </Sheet>
  );
}

const QUICK = 5;
const QUICK_GAP = 10;
const OUTLINE = 3;
const NAME_TAG = 30;
const CHIPS = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: KIT.size.chipsGap };

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
  const { colors } = useTheme();
  const scenes = TABLE_ICONS.filter((i) => i.theme === theme);
  return (
    <View className="gap-2" testID="table-icon-picker">
      <Chips
        accessibilityLabel={tr.createTable.iconLabel}
        value={theme}
        onChange={onTheme}
        options={TABLE_ICON_THEMES.map((t) => ({ value: t, label: t }))}
      />
      <View
        accessibilityRole="radiogroup"
        className="flex-row flex-wrap"
        style={{ gap: SPACING[2] }}
      >
        {scenes.map((scene) => {
          const taken = used.has(scene.id) && scene.id !== selected;
          const on = scene.id === selected;
          return (
            <Pressable
              key={scene.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: taken }}
              accessibilityLabel={taken ? tr.createTable.iconTaken(scene.name) : scene.name}
              disabled={taken}
              onPress={() => onSelect(scene.id)}
              style={{
                opacity: taken ? TABLE_ICON_TAKEN_OPACITY : 1,
                borderRadius: TABLE_ICON_SIZE.picker * TABLE_ICON_RADIUS_SHARE + 3,
                borderWidth: 3,
                borderColor: on ? colors.text : 'transparent',
                padding: 1,
              }}
            >
              <TableIcon icon={scene.id} size="picker" />
            </Pressable>
          );
        })}
      </View>
      <Text variant="fine">{tr.createTable.iconNote}</Text>
    </View>
  );
}
