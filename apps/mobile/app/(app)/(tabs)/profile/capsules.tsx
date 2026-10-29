import { randomNick } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { LookAvatar } from '@/components/LookAvatar';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const COLUMNS = 3;
const looks = CAPSULE_CATALOG.readyLooks;

// Kapsül karakterler (skall tuvali, KapsulGaleri; K-61): what an anonymous person looks like at a
// table, the three faces a person can have, and the ready capsules with sample names ("İsimleri
// yenile" draws new ones; they are examples, nobody's).
export default function CapsulesScreen() {
  const { colors, shape, scheme } = useTheme();
  const { width } = useWindowDimensions();
  const [names, setNames] = useState(() => looks.map(() => randomNick(2, Math.random)));
  const side = shape.screenPadding;
  const tile = (width - side * 2 - SPACING[2] * (COLUMNS - 1)) / COLUMNS;
  const sample = looks[looks.length - 2]?.code ?? '';
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: AURA[scheme].ground }}>
      {/* The colour clouds (docs/design/aura → Kapsülün). */}
      <AuraBackground />
      <View className="flex-row items-center gap-3" style={{ padding: SPACING[4] }}>
        <IconButton
          round
          icon="chevron-back"
          label={tr.common.back}
          onPress={() => router.back()}
        />
        <View className="flex-1">
          <Text variant="heading" accessibilityRole="header">
            {tr.capsule.galleryTitle}
          </Text>
          <Text variant="fine">{tr.capsule.gallerySub(looks.length)}</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: side,
          paddingBottom: SPACING[8],
          gap: SPACING[4],
        }}
      >
        <Text variant="fine">{tr.capsule.galleryBody}</Text>
        <Text variant="heading">{tr.capsule.threeStates}</Text>
        <Card>
          <View className="flex-row justify-around">
            <State
              face={<Avatar kind="profile" name={tr.capsule.sampleNames[0]} size="xl" />}
              name={tr.capsule.sampleNames[0]}
              note={tr.capsule.statePhoto}
            />
            <State
              face={<Avatar kind="default" size="xl" />}
              name={tr.capsule.sampleNames[1]}
              note={tr.capsule.stateHidden}
            />
            <State
              face={<LookAvatar look={sample} size={SPACING[12]} />}
              name={names[0] ?? ''}
              note={tr.capsule.stateAnon}
            />
          </View>
        </Card>
        <View className="flex-row items-center gap-3">
          <Text variant="heading" className="flex-1">
            {tr.capsule.anonCapsules}
          </Text>
          <Button
            size="sm"
            variant="secondary"
            icon="refresh"
            label={tr.capsule.renewNames}
            onPress={() => setNames(looks.map(() => randomNick(2, Math.random)))}
          />
        </View>
        <View className="flex-row flex-wrap" style={{ gap: SPACING[2] }}>
          {looks.map((l, i) => (
            <View
              key={l.code}
              className="items-center"
              style={{
                width: tile,
                gap: SPACING[1],
                paddingVertical: SPACING[3],
                paddingHorizontal: SPACING[1],
                borderRadius: shape.radius.lg,
                backgroundColor: colors.surface,
                boxShadow: shape.shadow.card,
              }}
            >
              <LookAvatar look={l.code} size={SPACING[12]} />
              <Text variant="label" align="center">
                {names[i] ?? ''}
              </Text>
              <Text variant="caption" tone="muted" align="center">
                {l.name}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function State({ face, name, note }: { face: ReactNode; name: string; note: string }) {
  return (
    <View className="flex-1 items-center gap-1.5" style={{ paddingHorizontal: SPACING[1] }}>
      {face}
      <Text variant="label" align="center">
        {name}
      </Text>
      <Text variant="caption" tone="muted" align="center">
        {note}
      </Text>
    </View>
  );
}
