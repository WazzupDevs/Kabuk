import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn, Glass, T } from '@/aura/kit';
import { GameDisc, GameIcon } from '@/components/Glyph';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { useLeaveKeyboard } from '@/lib/modalKeyboard';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING, TOUCH } from '@/theme/tokens';

const ART = SPACING[16];

type Props = {
  visible: boolean;
  // "Geç" and "Anladım" both close it; the parent remembers it was seen.
  onClose: () => void;
};

// Sesli Tabu's first-game intro (canvas: Aşama 6 · Oyunlar → İlk oyun tanıtımı): one screen, three
// steps (the describing table, the judging table, the buttons), skippable.
export function FirstGameIntro({ visible, onClose }: Props) {
  const { colors, shape } = useTheme();
  useLeaveKeyboard(visible);
  const art = [
    <GameIcon key="d" name="tabu" color={colors.text} size={SPACING[8]} />,
    <T key="j" v="title" color={KIT.danger}>
      !
    </T>,
    <View key="b" className="flex-row gap-1">
      <View
        style={{
          width: SPACING[4],
          height: SPACING[7],
          borderRadius: shape.radius.sm / 2,
          backgroundColor: colors.success,
        }}
      />
      <View
        style={{
          width: SPACING[4],
          height: SPACING[7],
          borderRadius: shape.radius.sm / 2,
          backgroundColor: colors.danger,
        }}
      />
    </View>,
  ];
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView testID="first-game-intro" style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: shape.screenPadding, gap: SPACING[4] }}
        >
          <View className="flex-row items-center justify-between">
            <Text variant="overline" tone="muted">
              {tr.games.introEyebrow}
            </Text>
            <Pressable
              testID="intro-skip"
              accessibilityRole="button"
              onPress={onClose}
              style={{
                minHeight: TOUCH.min,
                minWidth: TOUCH.min,
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
              <T v="fine" ink>
                {tr.games.introSkip}
              </T>
            </Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <GameDisc name="tabu" size={SPACING[16]} />
            <T v="display" accessibilityRole="header" style={{ flex: 1 }}>
              {tr.games.introTitle}
            </T>
          </View>
          {tr.games.introSteps.map((step, i) => (
            <Glass key={step.title} sm pad="pad">
              <View className="flex-row items-start gap-3">
                <View
                  className="items-center justify-center"
                  style={{
                    width: ART,
                    height: ART,
                    borderRadius: shape.radius.md,
                    backgroundColor: colors.surface2,
                  }}
                >
                  {art[i]}
                </View>
                <View className="flex-1 gap-1">
                  <Text variant="overline" tone="muted">
                    {tr.games.introStep(i + 1)}
                  </Text>
                  <T v="h3">{step.title}</T>
                  <T v="fine">{step.body}</T>
                </View>
              </View>
            </Glass>
          ))}
        </ScrollView>
        {/* Pinned under the steps: reachable on short screens without scrolling. */}
        <View style={{ padding: shape.screenPadding, paddingTop: SPACING[3] }}>
          <Btn block testID="intro-done" label={tr.games.introDone} onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
