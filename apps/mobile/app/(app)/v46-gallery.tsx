import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
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
  const [narrow, setNarrow] = useState(params.width === '320');
  const theme = useMemo(() => themeFor(scheme), [scheme]);
  if (!designPickerEnabled) return <Redirect href="/" />;
  return (
    <ThemeScope theme={theme}>
      <View style={[{ flex: 1 }, colorVars(theme.colors)]} testID={`v46-gallery-${scheme}`}>
        <Screen>
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
          <Colors scheme={scheme} />
          <TypeStyles scheme={scheme} />
          {narrow ? (
            <WidthScope width={NARROW_WIDTH}>
              <Components scheme={scheme} />
            </WidthScope>
          ) : (
            <Components scheme={scheme} />
          )}
        </Screen>
      </View>
    </ThemeScope>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-8 gap-3">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Colors({ scheme }: { scheme: ColorScheme }) {
  const { shape, colors } = useTheme();
  const palette = V46_PALETTE[scheme];
  return (
    <Section title={tr.design.gallery.colors}>
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
    </Section>
  );
}

// Each type style on its line box (the soft ground is the line height), so a line height that is
// off shows as a taller or shorter band.
function TypeStyles({ scheme }: { scheme: ColorScheme }) {
  return (
    <Section title={tr.design.gallery.type}>
      {(Object.keys(V46_TYPE) as V46TypeKey[]).map((key) => (
        <View key={key} className="items-start" testID={`gal-type-${key}`}>
          <View style={{ backgroundColor: V46_PALETTE[scheme].surfaceSoft }}>
            <UiText type={key}>{tr.design.gallery.sample}</UiText>
          </View>
          <Text variant="caption" tone="muted">
            {tr.design.gallery.typeLine(key, V46_TYPE[key].lineHeight)}
          </Text>
        </View>
      ))}
    </Section>
  );
}

function Components({ scheme }: { scheme: ColorScheme }) {
  return (
    <Section title={tr.design.gallery.components}>
      {galleryGroups().map((group) => (
        <View key={group.name} className="gap-4">
          <Text variant="overline" tone="muted">
            {group.name}
          </Text>
          {group.ids.map((id) => (
            <ComponentEntry key={id} id={id} scheme={scheme} states={UI_GALLERY[id]} />
          ))}
        </View>
      ))}
    </Section>
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
