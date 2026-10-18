import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AVATAR_SIZE } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CapsuleAvatar } from '@/components/CapsuleAvatar';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { tr } from '@/i18n/tr';
import { type FrameStats, frameStats } from '@/lib/frameStats';
import { CAPSULE_KEYS, type CapsuleLook, capsuleSvg } from '@/theme/capsules';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

import { PreviewBlock } from './PreviewBlock';

type Mode = 'cached' | 'parsed';

const MESSAGES = 100;
const PEOPLE = 12;
const LIST_HEIGHT = SPACING[16] * 6;
// A scroll counts as over this long after its last event.
const SCROLL_IDLE_MS = 300;

// Bileşen önizleme → Ölçüm (docs/SPEC_V4.md §4.M, 4.3; the CTO's 4.2b review): a venue chat of 100
// messages and a table of 12 people with capsule avatars, scrolled by hand on a low-end Android.
// While a list scrolls, the gaps between the JS thread's frames are measured (src/lib/frameStats.ts).
// "Her seferinde ayrıştır" draws the avatars as before the cache (each parses its SVG), to compare.
export function MeasureSet() {
  const t = tr.design.measure;
  const [mode, setMode] = useState<Mode>('cached');
  const meter = useScrollFrames();
  const looks = useMemo(
    () => Array.from({ length: MESSAGES }, (_, i) => CAPSULE_KEYS[(i * 7) % CAPSULE_KEYS.length]),
    [],
  );

  return (
    <View className="gap-4">
      <Segmented
        accessibilityLabel={t.set}
        options={[
          { value: 'cached', label: t.cached, testID: 'measure-cached' },
          { value: 'parsed', label: t.parsed, testID: 'measure-parsed' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          meter.reset();
        }}
      />
      <Text variant="fine" tone="muted">
        {t.hint}
      </Text>

      <PreviewBlock title={t.chat}>
        {/* Right above the list: on screen whenever the list is. */}
        <View className="flex-row items-center gap-3" testID="measure-stats">
          <Text variant="bodyStrong" tabular className="flex-1">
            {t.stats(meter.stats.frames, meter.stats.stalls, meter.stats.worstMs, meter.stats.fps)}
          </Text>
          <Button size="sm" variant="neutral" label={t.reset} onPress={meter.reset} />
        </View>
        <FlatList
          testID="measure-chat"
          data={looks}
          keyExtractor={(_, i) => String(i)}
          style={{ height: LIST_HEIGHT }}
          nestedScrollEnabled
          onScroll={meter.onScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <Row look={item ?? 'ghost'} mode={mode} name={t.name(index)} text={t.message(index)} />
          )}
        />
      </PreviewBlock>

      <PreviewBlock title={t.table}>
        <FlatList
          testID="measure-table"
          data={looks.slice(0, PEOPLE)}
          keyExtractor={(_, i) => String(i)}
          style={{ height: LIST_HEIGHT }}
          nestedScrollEnabled
          onScroll={meter.onScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <Row look={item ?? 'ghost'} mode={mode} name={t.name(index)} text={t.person} />
          )}
        />
      </PreviewBlock>
    </View>
  );
}

function Row({
  look,
  mode,
  name,
  text,
}: {
  look: CapsuleLook;
  mode: Mode;
  name: string;
  text: string;
}) {
  const { colors, shape } = useTheme();
  return (
    <View className="flex-row items-start gap-2.5 py-1.5">
      {mode === 'cached' ? <CapsuleAvatar look={look} size="sm" /> : <ParsedCapsule look={look} />}
      <View
        className="flex-1 gap-0.5 px-3 py-2"
        style={{ backgroundColor: colors.surface2, borderRadius: shape.radius.md }}
      >
        <Text variant="label">{name}</Text>
        <Text>{text}</Text>
      </View>
    </View>
  );
}

// The avatar as it was drawn before the cache: every one parses its SVG again.
function ParsedCapsule({ look }: { look: CapsuleLook }) {
  const { shape } = useTheme();
  const xml = useMemo(() => capsuleSvg(look), [look]);
  const side = AVATAR_SIZE.sm;
  return (
    <View
      style={{ width: side, height: side, borderRadius: shape.radius.pill, overflow: 'hidden' }}
    >
      <SvgXml xml={xml} width={side} height={side} />
    </View>
  );
}

// The JS thread's frame gaps while a list scrolls: a frame loop runs from a scroll event until the
// scroll has been still for a moment. Outside React: the loop reads the clock.
class ScrollFrames {
  private gaps: number[] = [];
  private last = 0;
  private until = 0;
  private frame = 0;

  constructor(private readonly report: (stats: FrameStats) => void) {}

  scrolled = () => {
    this.until = performance.now() + SCROLL_IDLE_MS;
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  };

  reset = () => {
    this.gaps = [];
    this.report(frameStats([]));
  };

  stop = () => cancelAnimationFrame(this.frame);

  private tick = () => {
    const now = performance.now();
    if (this.last) this.gaps.push(now - this.last);
    this.last = now;
    if (now < this.until) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.frame = 0;
    this.last = 0;
    this.report(frameStats(this.gaps));
  };
}

function useScrollFrames() {
  const [stats, setStats] = useState(() => frameStats([]));
  const [meter] = useState(() => new ScrollFrames(setStats));
  useEffect(() => () => meter.stop(), [meter]);
  return { stats, onScroll: meter.scrolled, reset: meter.reset };
}
