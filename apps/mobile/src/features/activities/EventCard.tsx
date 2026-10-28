import { describeEventTime } from '@shared/explore.ts';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Glass, T, Tag } from '@/aura/kit';
import { MarkDisk } from '@/aura/MarkDisk';
import { Gathering, SceneGround } from '@/aura/Scene';
import { usePressScale } from '@/components/motion';
import type { ExploreEvent } from '@/features/explore/useExploreVenues';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import type { CoverKind } from '@/theme/eventCovers';
import { SPACING } from '@/theme/tokens';

// One of today's events, in the manner of Keşfet's venue card (docs/design/aura → Keşfet): a glass
// card, a scene with buddies gathered round the mark and "Etkinlik" and the time on it, the title
// and the venue under it. No "ilgileniyorum" and no count (K-15). It opens the venue's page in
// Keşfet (K-43).
export function EventCard({
  venue,
  event,
  now,
  onPress,
}: {
  venue: { name: string; kind: CoverKind };
  event: ExploreEvent;
  now: number;
  onPress: () => void;
}) {
  const pressScale = usePressScale();
  const [width, setWidth] = useState(0);
  const when = tr.explore.eventTime(describeEventTime(event.startsAt, event.endsAt, now));
  const g = AURA.gatherings.explore;
  const k = width > 0 ? width / g.frame : 1;
  return (
    <Pressable
      testID={`activities-event-${venue.name}`}
      accessibilityRole="button"
      accessibilityLabel={tr.activities.eventLabel(event.title, venue.name, when)}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={pressScale(pressed)}>
          <Glass style={{ padding: CARD_PAD }}>
            <View
              onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
              style={{ height: g.height * k, borderRadius: SCENE_RADIUS, overflow: 'hidden' }}
            >
              <SceneGround top={SCENE_RADIUS} bottom={SCENE_RADIUS} />
              {width > 0 ? (
                <Gathering
                  kind="explore"
                  width={width}
                  center={<MarkDisk size={g.disk.size * k} />}
                />
              ) : null}
              <View
                className="absolute flex-row"
                style={{ top: SPACING[3], left: SPACING[3], right: SPACING[3], gap: SPACING[1.5] }}
              >
                <Tag tone="amber" label={tr.activities.eventKind} />
                <View style={{ marginLeft: 'auto' }}>
                  <Tag label={when} />
                </View>
              </View>
            </View>
            <View
              style={{
                gap: SPACING[0.5],
                paddingTop: KIT.size.rowGap,
                paddingHorizontal: SPACING[2.5],
                paddingBottom: SPACING[2],
              }}
            >
              <T v="h3">{event.title}</T>
              <T v="fine" strong color={KIT.primary}>
                {venue.name}
              </T>
            </View>
          </Glass>
        </View>
      )}
    </Pressable>
  );
}

const CARD_PAD = 8;
const SCENE_RADIUS = 22;
