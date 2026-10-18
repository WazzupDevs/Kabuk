import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Confetti } from '@/components/game/Confetti';
import { CountIn } from '@/components/game/CountIn';
import { GameButton } from '@/components/game/GameButton';
import { GameToast, type GameToastMessage } from '@/components/game/GameToast';
import { GroundView } from '@/components/game/GroundView';
import { RING_SIZE, RingCounter } from '@/components/game/RingCounter';
import { TimerBar } from '@/components/game/TimerBar';
import { tr } from '@/i18n/tr';
import { gameGround, teamGround } from '@/theme/gameColors';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

const STAGE = 260;
const noop = () => undefined;

// Bileşen önizleme → Oyun parçaları (docs/SPEC_V4.md §4.C, step 4.2b): the game screens' parts on
// grounds in the run's scheme, for E2E to photograph. The moments (toast, 3-2-1, confetti) play on
// a button.
export function PartsSet() {
  const { scheme, shape } = useTheme();
  const t = tr.design.parts;
  const purple = teamGround(scheme, 'purple');
  const [toast, setToast] = useState<GameToastMessage | null>(null);
  const [countIn, setCountIn] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const ground = { borderRadius: shape.radius.lg, padding: SPACING[4] };

  return (
    <View className="gap-4">
      <PreviewBlock title={t.buttons}>
        <GroundView ground={purple} style={ground} testID="preview-parts-buttons">
          <View className="gap-3">
            <View className="flex-row gap-2.5">
              <GameButton
                kind="pass"
                ground={purple}
                label={tr.design.tokens.pass}
                onPress={noop}
              />
              <GameButton
                kind="correct"
                ground={purple}
                label={tr.design.tokens.correct}
                onPress={noop}
              />
            </View>
            <GameButton
              kind="forbidden"
              ground={purple}
              label={tr.design.tokens.forbidden}
              onPress={noop}
            />
            <GameButton ground={purple} label={t.main} onPress={noop} />
            <GameButton kind="side" ground={purple} label={t.side} onPress={noop} />
            <GameButton ground={purple} label={t.grab} onPress={noop} large />
            <View className="flex-row gap-2.5">
              <GameButton
                kind="pass"
                ground={purple}
                label={t.disabledPass}
                onPress={noop}
                disabled
              />
              <GameButton ground={purple} label={t.busy} onPress={noop} loading />
            </View>
          </View>
        </GroundView>
      </PreviewBlock>

      <PreviewBlock title={t.timer}>
        <GroundView
          ground={gameGround(scheme, 'letters')}
          style={ground}
          testID="preview-parts-timer"
        >
          <View className="gap-2">
            <TimerBar secondsLeft={42} totalSeconds={60} />
            <TimerBar secondsLeft={4} totalSeconds={60} />
          </View>
        </GroundView>
      </PreviewBlock>

      <PreviewBlock title={t.ring}>
        <GroundView
          ground={gameGround(scheme, 'sahtekar')}
          style={{ ...ground, paddingBottom: SPACING[6] }}
          testID="preview-parts-ring"
        >
          <View className="flex-row flex-wrap justify-center gap-4">
            <RingCounter secondsLeft={18} totalSeconds={30} size={RING_SIZE.sm}>
              <Avatar kind="profile" name="Defne Kaya" size="hero" />
            </RingCounter>
            <RingCounter secondsLeft={3} totalSeconds={30} size={RING_SIZE.sm}>
              <Avatar kind="table" alias="Atak Tilki" size="hero" />
            </RingCounter>
          </View>
        </GroundView>
      </PreviewBlock>

      <PreviewBlock title={t.moments}>
        <GroundView
          ground={gameGround(scheme, 'song')}
          style={{ height: STAGE, borderRadius: shape.radius.lg }}
          testID="preview-parts-stage"
        >
          {countIn > 0 ? <CountIn key={countIn} onDone={() => setCountIn(0)} /> : null}
          {confetti > 0 ? <Confetti burst={confetti} seed={confetti} /> : null}
          <GameToast message={toast} top={SPACING[4]} testID="game-toast" />
        </GroundView>
        <View className="gap-2">
          <Button
            variant="secondary"
            label={t.showToast}
            onPress={() => setToast({ id: Date.now(), text: t.toast, bad: true })}
            testID="preview-parts-toast"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="secondary"
                label={t.countIn}
                onPress={() => setCountIn((n) => n + 1)}
                testID="preview-parts-countin"
              />
            </View>
            <View className="flex-1">
              <Button
                variant="secondary"
                label={t.confetti}
                onPress={() => setConfetti((n) => n + 1)}
                testID="preview-parts-confetti"
              />
            </View>
          </View>
        </View>
      </PreviewBlock>
    </View>
  );
}
