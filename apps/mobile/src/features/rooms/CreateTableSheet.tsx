import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { TABLE_ICON_THEMES, TABLE_ICONS } from '@shared/tableIcons.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Pills } from '@/components/Pills';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { Toggle } from '@/components/Toggle';
import { useProfile } from '@/features/account/useProfile';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { roomsApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { roomKeys } from './queries';
import {
  TABLE_ICON_RADIUS_SHARE,
  TABLE_ICON_SIZE,
  TABLE_ICON_TAKEN_OPACITY,
  TableIcon,
} from './TableIcon';

type IntentChoice = Intent | 'none';
type TagChoice = Concept | 'none';

type Props = {
  onClose: () => void;
  venueId: string;
  // Icons of the venue's other open and running tables: shown faded and not chosen (K-45).
  usedIcons: ReadonlySet<string>;
  // The check-in's identity: the name the person sits with (docs/SPEC_V4.md §4.D).
  anonymous: boolean;
};

// "Masa kur" (v46 data-kur; docs/SPEC_V4.md §4.E): the table's icon (one of the free scenes,
// changed with the picker), whether it goes into the lobby (with the intent and game tag then), and
// the name the person sits with. The server names the table and checks the icon; an icon taken
// meanwhile is swapped for a free one. Then the table opens.
export function CreateTableSheet({ onClose, venueId, usedIcons, anonymous }: Props) {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const photo = useOwnPhoto();
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

  return (
    <Sheet visible onClose={onClose} title={tr.createTable.title}>
      <Text variant="fine" tone="text">
        {tr.createTable.hint}
      </Text>

      <Pressable
        testID="table-icon-pick"
        accessibilityRole="button"
        accessibilityState={{ expanded: picking }}
        accessibilityLabel={tr.createTable.iconLabel}
        onPress={() => setPicking((v) => !v)}
        className="flex-row items-center gap-3"
      >
        <TableIcon icon={icon} size="picker" />
        <Text variant="label" tone="accent">
          {picking ? tr.createTable.iconDone : tr.createTable.iconChange}
        </Text>
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

      <Toggle
        testID="table-lobby"
        label={tr.createTable.lobby}
        hint={tr.createTable.lobbyHint}
        value={lobby}
        onChange={setLobby}
      />

      {lobby ? (
        <View className="gap-2">
          <Pills<IntentChoice>
            value={intent ?? 'none'}
            onChange={(v) => setIntent(v === 'none' ? null : v)}
            options={[
              { value: 'none', label: tr.rooms.intentNone, testID: 'intent-none' },
              ...INTENTS.map((i) => ({ value: i, label: tr.intents[i], testID: `intent-${i}` })),
            ]}
          />
          <Pills<TagChoice>
            wrap
            value={tag ?? 'none'}
            onChange={(v) => setTag(v === 'none' ? null : v)}
            options={[
              { value: 'none', label: tr.rooms.gameTagNone, testID: 'game-tag-none' },
              ...CONCEPTS.map((c) => ({
                value: c,
                label: tr.concepts[c],
                testID: `game-tag-${c}`,
              })),
            ]}
          />
        </View>
      ) : null}

      <View className="flex-row items-center gap-3">
        {anonymous ? (
          <Avatar kind="default" size="sm" />
        ) : (
          <Avatar kind="profile" name={name} photoUrl={photo.url} size="sm" />
        )}
        <Text className="flex-1">{tr.createTable.youAre(name)}</Text>
      </View>

      {create.isError ? (
        <Text variant="fine" tone="danger" accessibilityLiveRegion="polite">
          {errorMessage(create.error)}
        </Text>
      ) : null}
      <Button
        size="lg"
        testID="table-create"
        label={tr.createTable.confirm}
        onPress={() => create.mutate()}
        loading={create.isPending}
      />
    </Sheet>
  );
}

// The icon picker (v46 .mk-pick): the themes as tabs that scroll, the theme's five scenes in five
// columns; a scene at another table of the venue is faded and not chosen ("…, başka bir masada").
function IconPicker({
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Pills
          value={theme}
          onChange={onTheme}
          options={TABLE_ICON_THEMES.map((t) => ({ value: t, label: t }))}
        />
      </ScrollView>
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
