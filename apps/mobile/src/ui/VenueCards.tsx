import type { ReactNode } from 'react';
import { Animated, Pressable, Text, View, type ViewStyle } from 'react-native';

import { useLoopActive } from '@/components/Loader';
import { StateMark } from '@/components/EmptyState';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { gradientStyle } from '@/theme/gradient';
import { V46_VENUE, V46_VENUE_ICONS, V46_VENUE_MOTION } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { LiveDot } from './LiveDot';
import { useKeyframeLoop } from './nativeLoop';
import { V46Svg } from './V46Svg';

// Mekan's parts (v46 `section[data-page="venue"]`; values: V46_VENUE, scripts/v46/venue.ts): the
// venue's name, the card every part of the screen sits on, the venue chat's link card, the own
// card without a table and with one, a list's head and its note, and the empty lobby.

type Sides = readonly [number, number, number, number];
const pad = ([top, right, bottom, left]: Sides): ViewStyle => ({
  paddingTop: top,
  paddingRight: right,
  paddingBottom: bottom,
  paddingLeft: left,
});

const useVenue = () => V46_VENUE[useTheme().scheme];

// The venue's name under the top row (`h1.venue`).
export function VenueTitle({ name, testID }: { name: string; testID?: string }) {
  const v = useVenue();
  return (
    <Text
      accessibilityRole="header"
      testID={testID}
      style={[
        v46FontStyle(v.title.font, v.title.letterSpacing),
        { color: v.title.color, marginBottom: v.title.marginBottom },
      ]}
    >
      {name}
    </Text>
  );
}

// v46's card (`.va .card`): white (the dark card in the dark scheme), a hairline edge, 22 corners
// and a soft shadow. `glow`: the own card's corner glow (`.mine::before`), clipped by the card.
export function VenueCard({
  children,
  padding,
  glow = false,
  style,
  testID,
}: {
  children: ReactNode;
  padding: Sides;
  glow?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  const v = useVenue();
  const c = v.card;
  const box: ViewStyle = {
    backgroundColor: c.bg,
    borderWidth: c.border.width,
    borderColor: c.border.color,
    borderRadius: c.radius,
    boxShadow: c.shadow,
  };
  return (
    <View testID={testID} style={[box, style]}>
      {glow ? (
        // The glow is clipped by the card's corners, its shadow is not: it sits in its own layer.
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: c.radius - c.border.width,
            overflow: 'hidden',
          }}
        >
          <View
            style={[
              {
                position: 'absolute',
                right: v.glow.right,
                top: v.glow.top,
                width: v.glow.size,
                height: v.glow.size,
                borderRadius: v.glow.size / 2,
              },
              gradientStyle(v.glow.gradient),
            ]}
          />
        </View>
      ) : null}
      <View style={pad(padding)}>{children}</View>
    </View>
  );
}

// "Mekan sohbeti" (`.linkcard.chat`): the chat's disc, the name and who reads it, the live dot
// while the chat is active (K-12) and the arrow. The whole card is the button; it shrinks pressed.
export function VenueLinkCard({
  title,
  body,
  live,
  onPress,
  accessibilityLabel,
  testID,
  liveTestID,
}: {
  title: string;
  body: string;
  live: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
  liveTestID?: string;
}) {
  const v = useVenue();
  const l = v.link;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {({ pressed }) => (
        <VenueCard
          padding={l.padding}
          style={{ transform: [{ scale: pressed ? l.pressedScale : 1 }] }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: l.gap }}>
            <View
              style={[
                {
                  width: l.disc.size,
                  height: l.disc.size,
                  borderRadius: l.disc.size / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                gradientStyle(l.disc.gradient),
              ]}
            >
              <V46Svg
                drawing={V46_VENUE_ICONS.chat}
                size={[l.disc.icon.size, l.disc.icon.size]}
                color={l.disc.icon.color}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  v46FontStyle(l.title.font, l.title.letterSpacing),
                  { color: l.title.color },
                ]}
              >
                {title}
              </Text>
              <Text
                style={[v46FontStyle(l.body.font, l.body.letterSpacing), { color: l.body.color }]}
              >
                {body}
              </Text>
            </View>
            {live ? (
              <View testID={liveTestID} style={{ marginRight: l.dot.marginRight }}>
                <LiveDot size={l.dot.size} />
              </View>
            ) : null}
            <V46Svg
              drawing={V46_VENUE_ICONS.chevron}
              size={[l.chevron.size, l.chevron.size]}
              color={l.chevron.color}
            />
          </View>
        </VenueCard>
      )}
    </Pressable>
  );
}

// The own card without a table (`.mine.nomasa`): v46's mark, "Henüz masan yok" and the hint, and
// under them the card's button ("Masa kur", `action`). `footer`: the screen's quiet line (K-35).
export function NoTableCard({
  title,
  body,
  action,
  footer,
  testID,
}: {
  title: string;
  body: string;
  action: ReactNode;
  footer?: ReactNode;
  testID?: string;
}) {
  const n = useVenue().noTable;
  return (
    <VenueCard padding={n.padding} glow testID={testID}>
      <View style={{ gap: n.gap }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: n.head.gap }}>
          <V46Svg drawing={V46_VENUE_ICONS.noTable} size={[n.icon.size, n.icon.size]} />
          <View style={{ flex: 1, minWidth: 0, gap: n.middle.gap }}>
            <Text
              style={[v46FontStyle(n.title.font, n.title.letterSpacing), { color: n.title.color }]}
            >
              {title}
            </Text>
            <Text
              style={[v46FontStyle(n.body.font, n.body.letterSpacing), { color: n.body.color }]}
            >
              {body}
            </Text>
          </View>
        </View>
        {action}
        {footer}
      </View>
    </VenueCard>
  );
}

// The own card with a table (`.card.mine`): its head is one button (the table's icon, bobbing as
// `.emblem` does, its name, the dot and the state line, the round arrow) that opens the table;
// under it the owner's two buttons (`.two`, `actions`) and the screen's quiet line (`footer`).
export function MyTableCard({
  icon,
  name,
  status,
  inLobby,
  onOpen,
  openLabel,
  extra,
  actions,
  footer,
  testID,
  headTestID,
  nameTestID,
  statusTestID,
}: {
  icon: ReactNode;
  name: string;
  status: string;
  inLobby: boolean;
  onOpen: () => void;
  openLabel: string;
  // Between the head and the buttons (the lobby's intent and game tag).
  extra?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  testID?: string;
  headTestID?: string;
  nameTestID?: string;
  statusTestID?: string;
}) {
  const m = useVenue().mine;
  return (
    <VenueCard padding={m.padding} glow testID={testID}>
      <Pressable
        testID={headTestID}
        accessibilityRole="button"
        accessibilityLabel={openLabel}
        onPress={onOpen}
      >
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: m.head.gap,
              transform: [{ scale: pressed ? m.head.pressedScale : 1 }],
            }}
          >
            <Bobbing>{icon}</Bobbing>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                testID={nameTestID}
                style={[
                  v46FontStyle(m.title.font, m.title.letterSpacing),
                  { color: m.title.color },
                ]}
              >
                {name}
              </Text>
              <View
                testID={statusTestID}
                style={{ flexDirection: 'row', alignItems: 'center', gap: m.status.gap }}
              >
                <View
                  style={{
                    width: m.dot.size,
                    height: m.dot.size,
                    borderRadius: m.dot.size / 2,
                    backgroundColor: inLobby ? m.dot.on : m.dot.off,
                  }}
                />
                <Text
                  style={[
                    v46FontStyle(m.status.font, m.status.letterSpacing),
                    { color: m.status.color, flexShrink: 1 },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
            <View
              style={{
                width: m.go.size,
                height: m.go.size,
                borderRadius: m.go.size / 2,
                backgroundColor: m.go.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <V46Svg
                drawing={V46_VENUE_ICONS.chevron}
                size={[m.go.chevron.size, m.go.chevron.size]}
                color={m.go.chevron.color}
              />
            </View>
          </View>
        )}
      </Pressable>
      {extra}
      {actions ? (
        <View style={{ flexDirection: 'row', gap: m.actions.gap, marginTop: m.actions.marginTop }}>
          {actions}
        </View>
      ) : null}
      {footer}
    </VenueCard>
  );
}

// `.va .emblem`: up 2 and turned −2° at the middle of 3.4 s, for ever; still with reduce motion and
// where loops hold. On the native driver (nativeLoop.ts).
function Bobbing({ children }: { children: ReactNode }) {
  const bob = V46_VENUE_MOTION.bob;
  const reduce = useReduceMotion();
  const plays = useLoopActive() && !(reduce && bob.offWhenReduced);
  const y = useKeyframeLoop(bob, 'translateY', plays, { rest: 0 });
  const turn = useKeyframeLoop(bob, 'rotate', plays, { rest: 0 });
  const rotate =
    typeof turn === 'number'
      ? `${turn}deg`
      : turn.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ translateY: y }, { rotate }] }}>{children}</Animated.View>
  );
}

// The size of the own table's icon (`.mine-ic`).
export function useMyTableIconSize(): number {
  return useVenue().mine.icon.size;
}

// A list's head (`.sec`): its title and, on the right, how many.
export function SectionHead({ title, count }: { title: string; count: string }) {
  const s = useVenue().section;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: s.margin[0],
        marginRight: s.margin[1],
        marginBottom: s.margin[2],
        marginLeft: s.margin[3],
      }}
    >
      <Text
        accessibilityRole="header"
        style={[
          v46FontStyle(s.title.font, s.title.letterSpacing),
          { color: s.title.color, flexShrink: 1 },
        ]}
      >
        {title}
      </Text>
      <Text style={[v46FontStyle(s.count.font, s.count.letterSpacing), { color: s.count.color }]}>
        {count}
      </Text>
    </View>
  );
}

// The line under a list's head (`.note`).
export function VenueNote({ children }: { children: string }) {
  const n = useVenue().note;
  return (
    <Text
      style={[
        v46FontStyle(n.font, n.letterSpacing),
        {
          color: n.color,
          marginTop: n.margin[0],
          marginRight: n.margin[1],
          marginBottom: n.margin[2],
          marginLeft: n.margin[3],
        },
      ]}
    >
      {children}
    </Text>
  );
}

// The empty lobby (`.empty-card`): the empty state's living mark and what to do.
export function EmptyLobbyCard({ title, body }: { title: string; body: string }) {
  const e = useVenue().empty;
  return (
    <VenueCard padding={e.padding}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: e.gap }}>
        <StateMark kind="empty" size={e.mark} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[v46FontStyle(e.title.font, e.title.letterSpacing), { color: e.title.color }]}
          >
            {title}
          </Text>
          <Text
            style={[
              v46FontStyle(e.body.font, e.body.letterSpacing),
              { color: e.body.color, marginTop: e.body.marginTop },
            ]}
          >
            {body}
          </Text>
        </View>
      </View>
    </VenueCard>
  );
}
