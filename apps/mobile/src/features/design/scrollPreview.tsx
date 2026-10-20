import { View } from 'react-native';

import { Card } from '@/components/Card';
import { GameButton } from '@/components/game/GameButton';
import { GroundView } from '@/components/game/GroundView';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { teamGround } from '@/theme/gameColors';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

const CARDS = 20;
const noop = () => undefined;

// Bileşen önizleme → Kaydırma: 20 shadowed cards to scroll on a phone, by hand. Scrolling is not
// measured in CI: its emulator draws in software, so its speed says nothing about a phone. The
// kit's own cards, so the page draws what the app ships, and draws v46's cards as they arrive in
// the kit: a game ground with its buttons (drop shadows, the Yasak! ring), a card with the theme's
// shadow, the featured card.
export function ScrollSet() {
  return (
    <View className="gap-3" testID="preview-scroll">
      {Array.from({ length: CARDS }, (_, i) => (
        <ScrollCard key={i} index={i} />
      ))}
    </View>
  );
}

function ScrollCard({ index }: { index: number }) {
  const { scheme, shape } = useTheme();
  const t = tr.design.scroll;
  const kind = index % 3;
  if (kind === 0) {
    return (
      <GroundView
        ground={teamGround(scheme, index % 2 === 0 ? 'purple' : 'pink')}
        style={{ borderRadius: shape.radius.lg, padding: SPACING[4] }}
      >
        <View className="gap-3">
          <View className="flex-row gap-2.5">
            <GameButton
              kind="pass"
              ground={teamGround(scheme, 'purple')}
              label={tr.design.tokens.pass}
              onPress={noop}
            />
            <GameButton
              kind="correct"
              ground={teamGround(scheme, 'purple')}
              label={tr.design.tokens.correct}
              onPress={noop}
            />
          </View>
          <GameButton
            kind="forbidden"
            ground={teamGround(scheme, 'purple')}
            label={tr.design.tokens.forbidden}
            onPress={noop}
          />
        </View>
      </GroundView>
    );
  }
  return (
    <Card tone={kind === 1 ? 'card' : 'feature'}>
      <View className="gap-1">
        <Text variant="heading">{t.card(index + 1)}</Text>
        <Text variant="body" tone="muted">
          {t.body}
        </Text>
      </View>
    </Card>
  );
}
