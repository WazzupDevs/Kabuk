import { randomNick } from '@shared/capsule.ts';
import { CAPSULE_CATALOG } from '@shared/capsuleCatalog.ts';
import { type ReactNode, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Av, Btn, T, useKit } from '@/aura/kit';
import { LookAvatar } from '@/components/LookAvatar';
import { PageTop } from '@/components/PageTop';
import { Screen } from '@/components/Screen';
import { useHideTabBar } from '@/components/TabBar';
import { tr } from '@/i18n/tr';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const COLUMNS = 3;
const looks = CAPSULE_CATALOG.readyLooks;

// Kapsül karakterler (skall tuvali, KapsulGaleri; K-61): what an anonymous person looks like at a
// table, the three faces a person can have, and the ready capsules with sample names ("İsimleri
// yenile" draws new ones; they are examples, nobody's).
// Aura v71 (KapsulKarakterler): the three faces 64, the photo-less one a control disc with the user
// icon 34; the tiles' capsules 48.
const FACE = KIT.size.av.lg;
const FACE_ICON = 34;
const TILE_FACE = KIT.size.av.row;

export default function CapsulesScreen() {
  // Editing, the tab bar is out of sight (the owner's call, 2 Kasım, 11.5, 12.2).
  useHideTabBar();
  const { colors, shape } = useTheme();
  const { c } = useKit();
  const { width } = useWindowDimensions();
  const [names, setNames] = useState(() => looks.map(() => randomNick(2, Math.random)));
  const side = shape.screenPadding;
  const tile = (width - side * 2 - SPACING[2] * (COLUMNS - 1)) / COLUMNS;
  const sample = looks[looks.length - 2]?.code ?? '';
  return (
    <Screen
      list
      gap={SPACING[4]}
      top={<PageTop title={tr.capsule.galleryTitle} sub={tr.capsule.gallerySub(looks.length)} />}
    >
      <T v="fine">{tr.capsule.galleryBody}</T>
      <T v="h3" accessibilityRole="header">
        {tr.capsule.threeStates}
      </T>
      <View
        className="flex-row justify-around"
        style={{
          paddingVertical: SPACING[4],
          paddingHorizontal: SPACING[1],
          borderRadius: shape.radius.lg,
          backgroundColor: colors.surface,
          boxShadow: shape.shadow.raised ?? undefined,
        }}
      >
        <State
          face={<Av size="lg" name={tr.capsule.sampleNames[0]} />}
          name={tr.capsule.sampleNames[0]}
          note={tr.capsule.statePhoto}
        />
        <State
          face={
            <View
              style={{
                width: FACE,
                height: FACE,
                borderRadius: FACE / 2,
                backgroundColor: colors.control,
                borderWidth: KIT.size.avRing,
                borderColor: colors.surface,
                boxShadow: shape.shadow.raised ?? undefined,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapIcon name="user" color={c.muted} size={FACE_ICON} />
            </View>
          }
          name={tr.capsule.sampleNames[1]}
          note={tr.capsule.stateHidden}
        />
        <State
          face={<LookAvatar look={sample} size={FACE} />}
          name={names[0] ?? ''}
          note={tr.capsule.stateAnon}
        />
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <T v="h3" accessibilityRole="header">
            {tr.capsule.anonCapsules}
          </T>
        </View>
        <Btn
          sm
          variant="glassy"
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
              boxShadow: shape.shadow.card ?? undefined,
            }}
          >
            <LookAvatar look={l.code} size={TILE_FACE} />
            <T v="fine" ink center>
              {names[i] ?? ''}
            </T>
            <T v="stamp" center>
              {l.name}
            </T>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function State({ face, name, note }: { face: ReactNode; name: string; note: string }) {
  return (
    <View className="flex-1 items-center gap-1.5" style={{ paddingHorizontal: SPACING[1] }}>
      {face}
      <T v="fine" ink center>
        {name}
      </T>
      <T v="stamp" center>
        {note}
      </T>
    </View>
  );
}
