import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { CapsuleAvatar } from '@/components/CapsuleAvatar';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatWallpaper } from '@/components/ChatWallpaper';
import { EventCard } from '@/features/activities/EventCard';
import { tr } from '@/i18n/tr';
import { CAP_ICONS } from '@/theme/capIcons.generated';
import { CAPSULE_KEYS } from '@/theme/capsules';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

const ICONS = Object.keys(CAP_ICONS) as (keyof typeof CAP_ICONS)[];
const WALL = 260;

// Bileşen önizleme → Kapsül ve ikonlar (docs/SPEC_V4.md §4.C, step 4.2b): the 28 capsules and the
// ghost, the capsule icon family (Aura v65), and the chat wallpaper under two messages, in the run's scheme.
export function IdentitySet() {
  const { colors, shape } = useTheme();
  const window = useWindowDimensions();
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
          {ICONS.map((name) => (
            <CapIcon key={name} name={name} color={colors.text} />
          ))}
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
          <ChatWallpaper kind="dm" canvas={{ w: window.width, h: window.height }} />
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
