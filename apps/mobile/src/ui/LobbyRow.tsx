import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Loader } from '@/components/Loader';
import { gradientStyle } from '@/theme/gradient';
import { V46_VENUE, V46_VENUE_ICONS } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { V46Svg } from './V46Svg';
import { VenueCard } from './VenueCards';

// A table in Mekan's lobby (v46 `.card.row`; values: V46_VENUE.row): the table's icon, its name, the
// request's line while one is out (`small`), the chips (people, intent, game) and on the right its
// button ("Katıl") or the request's wait (`.wait`: Kesişme). `below`: a running table's
// "Bu masadayım" under the row, as wide as the card (`.row.big`).
export function LobbyRow({
  icon,
  name,
  note,
  chips,
  action,
  waiting = false,
  below,
  testID,
}: {
  icon: ReactNode;
  name: string;
  note?: string | null;
  chips: ReactNode;
  action?: ReactNode;
  waiting?: boolean;
  below?: ReactNode;
  testID?: string;
}) {
  const { scheme } = useTheme();
  const r = V46_VENUE[scheme].row;
  return (
    <VenueCard padding={r.padding} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: r.gap }}>
        {icon}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[v46FontStyle(r.title.font, r.title.letterSpacing), { color: r.title.color }]}
          >
            {name}
          </Text>
          {note ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[
                v46FontStyle(r.note.font, r.note.letterSpacing),
                { color: r.note.color, marginTop: r.note.marginTop },
              ]}
            >
              {note}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: r.meta.gap,
              marginTop: r.meta.marginTop,
            }}
          >
            {chips}
          </View>
        </View>
        {waiting ? (
          <View
            style={{
              width: r.wait.size,
              height: r.wait.size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader kind="swap" size={r.wait.loader} label={null} />
          </View>
        ) : (
          action
        )}
      </View>
      {below}
    </VenueCard>
  );
}

// A lobby row's chip (`.va .meta .chip`): v46's soft gradient pill; the people chip carries its
// icon.
export function LobbyChip({ label, people = false }: { label: string; people?: boolean }) {
  const { scheme } = useTheme();
  const c = V46_VENUE[scheme].chip;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: c.gap,
          paddingTop: c.padding[0],
          paddingRight: c.padding[1],
          paddingBottom: c.padding[2],
          paddingLeft: c.padding[3],
          borderRadius: c.radius,
          borderWidth: c.border.width,
          borderColor: c.border.color,
          boxShadow: c.shadow,
        },
        gradientStyle(c.gradient),
      ]}
    >
      {people ? (
        <V46Svg
          drawing={V46_VENUE_ICONS.people}
          size={[c.icon.size, c.icon.size]}
          color={c.icon.color}
        />
      ) : null}
      <Text style={[v46FontStyle(c.text.font, c.text.letterSpacing), { color: c.text.color }]}>
        {label}
      </Text>
    </View>
  );
}

// The gap above a running table's "Bu masadayım" (`.join.ghost`'s margin).
export function useHereGap(): number {
  return V46_VENUE[useTheme().scheme].here.marginTop;
}

// The gap between the lobby's rows (`.list`).
export function useLobbyGap(): number {
  return V46_VENUE[useTheme().scheme].list.gap;
}
