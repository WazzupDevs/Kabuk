import { useState } from 'react';
import { View } from 'react-native';

import { BarIcon, BellIcon } from '@/components/BarIcon';
import { CapsuleAvatar } from '@/components/CapsuleAvatar';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatWallpaper } from '@/components/ChatWallpaper';
import { EventCard } from '@/features/activities/EventCard';
import { tr } from '@/i18n/tr';
import type { BarIconKind } from '@/theme/barIcons';
import { CAPSULE_KEYS } from '@/theme/capsules';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

const ICONS: BarIconKind[] = ['plus', 'cross', 'check', 'lobby', 'minus'];
const WALL = 260;

// Bileşen önizleme → Kapsül ve ikonlar (docs/SPEC_V4.md §4.C, step 4.2b): the 28 capsules and the
// ghost, the bar icons and the bell, and the chat wallpaper under two messages, in the run's scheme.
export function IdentitySet() {
  const { colors, shape } = useTheme();
  const t = tr.design.identity;
  // Made-up events: one running for another hour, one starting in three.
  const [now] = useState(() => Date.now());
  const hour = 60 * 60 * 1000;
  const iso = (ms: number) => new Date(ms).toISOString();
  return (
    <View className="gap-4">
      <PreviewBlock title={t.capsules}>
        <View className="flex-row flex-wrap gap-2" testID="preview-identity-capsules">
          {CAPSULE_KEYS.map((key) => (
            <CapsuleAvatar key={key} look={key} size="md" />
          ))}
          <CapsuleAvatar look="ghost" size="md" />
        </View>
      </PreviewBlock>

      <PreviewBlock title={t.icons}>
        <View className="flex-row flex-wrap items-center gap-4" testID="preview-identity-icons">
          {ICONS.map((kind) => (
            <BarIcon key={kind} kind={kind} />
          ))}
          <BellIcon />
          <BellIcon unread={3} />
          <BellIcon unread={120} />
        </View>
      </PreviewBlock>

      <PreviewBlock title={t.covers}>
        <View className="gap-3" testID="preview-identity-covers">
          <EventCard
            venue={{ name: t.sampleCafe, kind: 'cafe' }}
            event={{ title: t.sampleNow, startsAt: iso(now - hour), endsAt: iso(now + hour) }}
            now={now}
            onPress={() => undefined}
          />
          <EventCard
            venue={{ name: t.sampleCampus, kind: 'campus' }}
            event={{
              title: t.sampleLater,
              startsAt: iso(now + 3 * hour),
              endsAt: iso(now + 6 * hour),
            }}
            now={now}
            onPress={() => undefined}
          />
        </View>
      </PreviewBlock>

      <PreviewBlock title={t.wallpaper}>
        <View
          className="justify-end overflow-hidden"
          style={{
            height: WALL,
            borderRadius: shape.radius.lg,
            padding: SPACING[3],
            backgroundColor: colors.canvas,
          }}
          testID="preview-identity-wallpaper"
        >
          <ChatWallpaper />
          <ChatBubble
            text={t.sampleTheirs}
            mine={false}
            avatar={<CapsuleAvatar look="pirate" size="sm" />}
            name={t.sampleName}
            time="21:40"
          />
          <ChatBubble text={t.sampleMine} mine time="21:41" delivery="read" />
        </View>
      </PreviewBlock>
    </View>
  );
}
