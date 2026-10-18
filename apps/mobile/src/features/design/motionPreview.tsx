import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BarIcon, BellIcon } from '@/components/BarIcon';
import { Button } from '@/components/Button';
import { DialCover } from '@/components/game/DialCover';
import { GroundView } from '@/components/game/GroundView';
import { LetterWheel } from '@/components/game/LetterWheel';
import { RoleCard } from '@/components/game/RoleCard';
import { TiltDeck } from '@/components/game/TiltDeck';
import { Equaliser, Vinyl } from '@/components/game/Vinyl';
import { Mark } from '@/components/Mark';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { gameGround, ON_GAME, teamGround } from '@/theme/gameColors';
import { type CardExit, DIAL, dialFacePath } from '@/theme/playMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'K', 'M', 'S', 'T'];
const DIAL_WIDTH = 240;
const ROLE_WIDTH = 180;
const ROLE_MARK = 56;
const VINYL_SIZE = 120;

// Bileşen önizleme → Hareketler (docs/SPEC_V4.md §4.C, step 4.2c): the game motions in the run's
// scheme, each played on a press, for E2E to photograph and for a look on the phone.
export function MotionSet() {
  const { scheme, colors, shape } = useTheme();
  const t = tr.design.motion;
  const [card, setCard] = useState(0);
  const [exit, setExit] = useState<CardExit | null>(null);
  const [spin, setSpin] = useState(0);
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(0);
  const [press, setPress] = useState(0);
  const [lobby, setLobby] = useState(false);
  const word = t.words[card % t.words.length] ?? t.words[0];
  const ground = { borderRadius: shape.radius.lg, padding: SPACING[4] };

  return (
    <View className="gap-4">
      <PreviewBlock title={t.deck}>
        <GroundView
          ground={teamGround(scheme, 'purple')}
          style={ground}
          testID="preview-motion-deck"
        >
          <View style={{ paddingBottom: SPACING[4] }}>
            <TiltDeck
              cardKey={card}
              exit={exit}
              onExited={() => {
                setExit(null);
                setCard((n) => n + 1);
              }}
            >
              <View className="items-center gap-3" style={{ padding: SPACING[5] }}>
                <Text variant="word" align="center">
                  {word}
                </Text>
                {t.forbidden.map((f) => (
                  <Text key={f} variant="forbidden" align="center">
                    {f}
                  </Text>
                ))}
              </View>
            </TiltDeck>
          </View>
          <Text variant="fine" color={ON_GAME} align="center">
            {t.deckHint}
          </Text>
        </GroundView>
        <View className="flex-row gap-2">
          {(
            [
              ['correct', t.correct],
              ['pass', t.pass],
              ['forbidden', t.forbiddenButton],
            ] as const
          ).map(([kind, label]) => (
            <View key={kind} className="flex-1">
              <Button
                variant="secondary"
                label={label}
                onPress={() => setExit(kind)}
                disabled={exit !== null}
                testID={`preview-motion-${kind}`}
              />
            </View>
          ))}
        </View>
      </PreviewBlock>

      <PreviewBlock title={t.role}>
        <GroundView ground={gameGround(scheme, 'sahtekar')} style={ground}>
          <View className="self-center" style={{ width: ROLE_WIDTH }}>
            <RoleCard
              accessibilityLabel={t.roleBack}
              faceLabel={t.roleFace(t.roleCategory, t.roleWord)}
              testID="preview-motion-role"
              back={
                <View
                  className="flex-1 items-center justify-center gap-3"
                  style={{ backgroundColor: colors.violet, padding: SPACING[4] }}
                >
                  <Mark size={ROLE_MARK} label={null} />
                  <Text variant="label" color={ON_GAME} align="center">
                    {t.roleBack}
                  </Text>
                </View>
              }
              face={
                <View
                  className="flex-1 items-center justify-center gap-2"
                  style={{ backgroundColor: colors.surface, padding: SPACING[4] }}
                >
                  <Text variant="overline" tone="accent">
                    {t.roleCategory}
                  </Text>
                  <Text variant="title" align="center">
                    {t.roleWord}
                  </Text>
                </View>
              }
            />
          </View>
        </GroundView>
      </PreviewBlock>

      <PreviewBlock title={t.wheel}>
        <GroundView
          ground={gameGround(scheme, 'letters')}
          style={ground}
          testID="preview-motion-wheel"
        >
          <LetterWheel
            letter="K"
            pool={LETTERS}
            spinKey={spin}
            ground={gameGround(scheme, 'letters')}
          />
        </GroundView>
        <Button
          variant="secondary"
          label={t.spin}
          onPress={() => setSpin((n) => n + 1)}
          testID="preview-motion-spin"
        />
      </PreviewBlock>

      <PreviewBlock title={t.vinyl}>
        <GroundView
          ground={gameGround(scheme, 'song')}
          style={ground}
          testID="preview-motion-vinyl"
        >
          <View className="flex-row items-center justify-center gap-4">
            <Equaliser group={0} />
            <Vinyl size={VINYL_SIZE} />
            <Equaliser group={1} />
          </View>
        </GroundView>
      </PreviewBlock>

      <PreviewBlock title={t.cover}>
        <GroundView
          ground={teamGround(scheme, 'pink')}
          style={ground}
          testID="preview-motion-cover"
        >
          <View
            className="self-center"
            style={{ width: DIAL_WIDTH, height: (DIAL_WIDTH * DIAL.height) / DIAL.width }}
          >
            <Svg
              width={DIAL_WIDTH}
              height={(DIAL_WIDTH * DIAL.height) / DIAL.width}
              viewBox={`0 0 ${DIAL.width} ${DIAL.height}`}
            >
              <Path d={dialFacePath()} fill={colors.surface} />
            </Svg>
            <DialCover open={open} width={DIAL_WIDTH} />
          </View>
        </GroundView>
        <Button
          variant="secondary"
          label={open ? t.closeCover : t.openCover}
          onPress={() => setOpen((o) => !o)}
          testID="preview-motion-cover-toggle"
        />
      </PreviewBlock>

      <PreviewBlock title={t.icons}>
        <View className="flex-row items-center gap-4" testID="preview-motion-icons">
          {(['plus', 'cross', 'check'] as const).map((kind) => (
            <BarIcon key={kind} kind={kind} size={ICON.xl} form pressKey={press} />
          ))}
          <BarIcon kind={lobby ? 'minus' : 'lobby'} size={ICON.xl} />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              variant="secondary"
              label={t.press}
              onPress={() => setPress((n) => n + 1)}
              testID="preview-motion-press"
            />
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              label={lobby ? t.lobbyClose : t.lobbyOpen}
              onPress={() => setLobby((o) => !o)}
              testID="preview-motion-lobby"
            />
          </View>
        </View>
      </PreviewBlock>

      <PreviewBlock title={t.bell}>
        <View className="flex-row items-center gap-4" testID="preview-motion-bell">
          <BellIcon unread={ring} ringKey={ring} />
          <View className="flex-1">
            <Button
              variant="secondary"
              label={t.ring}
              onPress={() => setRing((n) => n + 1)}
              testID="preview-motion-ring"
            />
          </View>
        </View>
      </PreviewBlock>
    </View>
  );
}
