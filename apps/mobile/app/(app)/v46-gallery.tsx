import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactElement, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { type GalleryState, UI_GALLERY } from '@/features/gallery/registry';
import { tr } from '@/i18n/tr';
import {
  colorVars,
  designPickerEnabled,
  ThemeScope,
  themeFor,
  useTheme,
} from '@/theme/ThemeProvider';
import type { ColorScheme } from '@/theme/tokens';
import { SPACING } from '@/theme/tokens';
import {
  V46_COMPONENTS,
  V46_PALETTE,
  V46_TYPE,
  type V46ComponentId,
  type V46TypeKey,
} from '@/theme/tokens.generated';
import { gradientStyle } from '@/theme/gradient';
import {
  type GalleryId,
  galleryGroups,
  galleryInfo,
  galleryTestId,
  isScreenPart,
} from '@/theme/v46Gallery';
import { WidthScope } from '@/ui/narrow';
import { Text as UiText } from '@/ui/Text';

// The width v46 checks its small screen at (its gallery note: 320 × 568).
const NARROW_WIDTH = 320;

// The gallery as rows of one list: each section's title, the colours, each type style, each group's
// name and each component. The list mounts the rows near the screen only, so a long gallery stays
// as light as a short one: every component of every group at once made each E2E scroll step take
// 6–14 s on CI's emulator (Maestro reads the whole view tree after each swipe), and the 120 s step
// to the first component ran out in dark (WazzupDevs/Kabuk#202, the nightly run of 21 Ekim).
type Row =
  | { kind: 'title'; key: string; title: string }
  | { kind: 'colors'; key: string }
  | { kind: 'type'; key: string; type: V46TypeKey }
  | { kind: 'group'; key: string; name: string }
  | { kind: 'entry'; key: string; id: GalleryId };

const ROWS: readonly Row[] = [
  { kind: 'title', key: 'title-colors', title: tr.design.gallery.colors },
  { kind: 'colors', key: 'colors' },
  { kind: 'title', key: 'title-type', title: tr.design.gallery.type },
  ...(Object.keys(V46_TYPE) as V46TypeKey[]).map((type): Row => ({
    kind: 'type',
    key: `type-${type}`,
    type,
  })),
  { kind: 'title', key: 'title-components', title: tr.design.gallery.components },
  ...galleryGroups().flatMap((group): Row[] => [
    { kind: 'group', key: `group-${group.name}`, name: group.name },
    ...group.ids.map((id): Row => ({ kind: 'entry', key: id, id })),
  ]),
];

// How many screens of rows the list keeps mounted: the one shown and two above and below it
// (FlatList's `windowSize`), so a fast scroll still finds the next rows drawn. Before the first
// scroll it draws the first rows only (the colours and the first type styles).
const WINDOW_SCREENS = 5;
const FIRST_ROWS = 6;

// Ayarlar → Tasarım (test) → v46 galeri (v46 native, step 2): v46's colours, type styles and
// components as the app draws them, in a fixed scheme, with fixed data, under the same ids as v46's
// own gallery (docs/design/v46/skall-masa-deneme-v46-galeri.html?page=galeri). A component not yet
// rewritten in src/ui shows v46's measured box and "Henüz yok". `?theme=light|dark` opens it in a
// scheme, `?width=320` with v46's narrow look (screenshots). Test builds only; production redirects
// away.
export default function V46GalleryScreen() {
  const params = useLocalSearchParams<{ theme?: string; width?: string }>();
  const viewer = useTheme().scheme;
  const [scheme, setScheme] = useState<ColorScheme>(
    params.theme === 'dark' || params.theme === 'light' ? params.theme : viewer,
  );
  // v46's narrow look (its `max-width` rules) on a wider phone: the components laid out for 320.
  // Only the width the rows read changes (src/ui/narrow.tsx); the rows stay mounted.
  const [narrow, setNarrow] = useState(params.width === '320');
  const { width } = useWindowDimensions();
  const theme = useMemo(() => themeFor(scheme), [scheme]);
  if (!designPickerEnabled) return <Redirect href="/" />;
  return (
    <ThemeScope theme={theme}>
      <View style={[{ flex: 1 }, colorVars(theme.colors)]} testID={`v46-gallery-${scheme}`}>
        <WidthScope width={narrow ? NARROW_WIDTH : width}>
          <GalleryList
            scheme={scheme}
            header={
              <>
                <ScreenHeader title={tr.design.gallery.title} onBack={() => router.back()} />
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {(['light', 'dark'] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === scheme ? 'primary' : 'neutral'}
                      label={tr.design.gallery[s]}
                      testID={`v46-gallery-scheme-${s}`}
                      onPress={() => setScheme(s)}
                    />
                  ))}
                  <Button
                    size="sm"
                    variant={narrow ? 'primary' : 'neutral'}
                    label={tr.design.gallery.narrow}
                    testID="v46-gallery-narrow"
                    onPress={() => setNarrow((n) => !n)}
                  />
                </View>
              </>
            }
          />
        </WidthScope>
      </View>
    </ThemeScope>
  );
}

// The rows on the canvas with the theme's side padding, as a scrolling screen lays them out
// (components/Screen.tsx), with each row's distance from the one above: a section's title 32, the
// rows under it 12, a group's components 16 (the gaps of the sections and groups they stood in).
function GalleryList({ scheme, header }: { scheme: ColorScheme; header: ReactElement }) {
  const { colors, shape } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <FlatList
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={ROWS}
          extraData={scheme}
          keyExtractor={(row) => row.key}
          ListHeaderComponent={header}
          renderItem={({ item }) => <GalleryRow row={item} scheme={scheme} />}
          initialNumToRender={FIRST_ROWS}
          windowSize={WINDOW_SCREENS}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: shape.screenPadding,
            paddingTop: SPACING[3],
            paddingBottom: SPACING[8],
          }}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GalleryRow({ row, scheme }: { row: Row; scheme: ColorScheme }) {
  switch (row.kind) {
    case 'title':
      return (
        <Text variant="heading" accessibilityRole="header" className="mt-8">
          {row.title}
        </Text>
      );
    case 'colors':
      return (
        <View className="mt-3">
          <Colors scheme={scheme} />
        </View>
      );
    case 'type':
      return (
        <View className="mt-3">
          <TypeStyle type={row.type} scheme={scheme} />
        </View>
      );
    case 'group':
      return (
        <Text variant="overline" tone="muted" className="mt-3">
          {row.name}
        </Text>
      );
    case 'entry':
      return (
        <View className="mt-4">
          <ComponentEntry id={row.id} scheme={scheme} states={UI_GALLERY[row.id]} />
        </View>
      );
  }
}

function Colors({ scheme }: { scheme: ColorScheme }) {
  const { shape, colors } = useTheme();
  const palette = V46_PALETTE[scheme];
  return (
    <View className="flex-row flex-wrap gap-3" testID="gal-colors">
      {(Object.keys(palette) as (keyof typeof palette)[]).map((name) => (
        <View
          key={name}
          className="gap-1"
          style={{ width: SPACING[16] + SPACING[8] }}
          testID={`gal-color-${name}`}
        >
          <View
            style={{
              height: SPACING[12],
              borderRadius: shape.radius.md,
              backgroundColor: palette[name],
              borderWidth: shape.stroke.hairline,
              borderColor: colors.divider,
            }}
          />
          <Text variant="caption">{name}</Text>
          <Text variant="caption" tone="muted">
            {palette[name]}
          </Text>
        </View>
      ))}
    </View>
  );
}

// A type style on its line box (the soft ground is the line height), so a line height that is off
// shows as a taller or shorter band.
function TypeStyle({ type, scheme }: { type: V46TypeKey; scheme: ColorScheme }) {
  return (
    <View className="items-start" testID={`gal-type-${type}`}>
      <View style={{ backgroundColor: V46_PALETTE[scheme].surfaceSoft }}>
        <UiText type={type}>{tr.design.gallery.sample}</UiText>
      </View>
      <Text variant="caption" tone="muted">
        {tr.design.gallery.typeLine(type, V46_TYPE[type].lineHeight)}
      </Text>
    </View>
  );
}

function ComponentEntry({
  id,
  scheme,
  states,
}: {
  id: GalleryId;
  scheme: ColorScheme;
  states: readonly GalleryState[] | undefined;
}) {
  const info = galleryInfo(id);
  return (
    <View className="gap-2" testID={galleryTestId(id)}>
      <Text variant="label">{info.name}</Text>
      <Text variant="caption" tone="muted">
        {tr.design.gallery.measured(id, info.width, info.height)}
      </Text>
      {states ? (
        states.map((s) => (
          <View key={s.key} className="gap-1">
            <Text variant="caption" tone="muted">
              {tr.design.gallery[s.key]}
            </Text>
            <View className={s.wide ? undefined : 'items-start'} testID={galleryTestId(id, s.key)}>
              {s.render()}
            </View>
          </View>
        ))
      ) : isScreenPart(id) ? null : (
        <Missing id={id} scheme={scheme} />
      )}
    </View>
  );
}

// v46's measured box, until the component is rewritten: its ground, edge, corner, height and
// shadow, as the tokens hold them.
function Missing({ id, scheme }: { id: V46ComponentId; scheme: ColorScheme }) {
  const c = V46_COMPONENTS[id];
  const look = c[scheme];
  const radius = typeof look.radius === 'number' ? look.radius : look.radius[0];
  return (
    <View className="gap-1">
      <View
        style={{
          ...(look.gradient ? gradientStyle(look.gradient) : {}),
          width: c.width,
          maxWidth: '100%',
          height: look.height,
          borderRadius: radius,
          backgroundColor: look.bg ?? undefined,
          borderWidth: look.border?.width ?? 0,
          borderColor: look.border?.color,
          boxShadow: look.shadow ?? undefined,
          opacity: look.opacity,
        }}
      />
      <Text variant="caption" tone="muted">
        {tr.design.gallery.missing}
      </Text>
    </View>
  );
}
