import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { type V46Text, V46_TOP_BARS } from '@/theme/parts.generated';
import { gradientStyle } from '@/theme/gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { v46FontStyle } from '@/theme/v46Type';

import { RoundButton } from './RoundButton';

// The head of a tab screen: Keşfet's (`.dhd`: the title and the list/map switch), Aktiviteler's
// (`.apin`: the title alone) and Mesajlar's (`.mpin`: the title and the bell).
type TabHead = {
  kind: 'explore' | 'activities' | 'messages';
  title: string;
  // The screen's own control at the end of the title's row (ViewModeToggle, the bell).
  right?: ReactNode;
};

// A sub page's head (`.fpin`): back, the title and a count after it (`h1 small`: Arkadaşlar 4).
type SubHead = {
  kind: 'sub';
  title: string;
  count?: string;
  onBack: () => void;
  backLabel: string;
};

type Props = (TabHead | SubHead) & {
  // What the head holds under its title (Keşfet's search and filters, the Mesajlar tabs).
  children?: ReactNode;
  // `<testID>-row`: the title's row (the visual gate crops to it).
  testID?: string;
};

// v46's pinned heads: the screen's ground, its padding, and a 16 dp fade from that ground below it
// (`::after`, over what scrolls under), the title in 28/800. The head stays on top of the content
// that scrolls under it (v46: `position: sticky; z-index: 6`); the screen puts it above its list.
export function TopBar(props: Props) {
  const { scheme } = useTheme();
  const bars = V46_TOP_BARS[scheme];
  const head = props.kind === 'sub' ? bars.sub : bars[props.kind];
  const title = (t: V46Text, text: string) => (
    <Text
      accessibilityRole="header"
      style={[v46FontStyle(t.font, t.letterSpacing), { color: t.color, flexShrink: 1 }]}
    >
      {text}
    </Text>
  );
  const rowId = props.testID ? `${props.testID}-row` : undefined;
  let content: ReactNode;
  if (props.kind === 'sub') {
    const sub = bars.sub;
    content = (
      <View testID={rowId} style={{ flexDirection: 'row', alignItems: sub.align, gap: sub.gap }}>
        <RoundButton
          look="yuvarlak-geri"
          onPress={props.onBack}
          accessibilityLabel={props.backLabel}
        />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 }}>
          {title(sub.title, props.title)}
          {props.count !== undefined ? (
            <Text
              style={[
                v46FontStyle(sub.count.font, sub.count.letterSpacing),
                { color: sub.count.color, marginLeft: sub.count.marginLeft },
              ]}
            >
              {props.count}
            </Text>
          ) : null}
        </View>
      </View>
    );
  } else {
    const row = bars[props.kind].row;
    content = row ? (
      <View
        testID={rowId}
        style={{
          flexDirection: 'row',
          alignItems: row.align,
          justifyContent: row.justify,
          minHeight: row.minHeight,
        }}
      >
        {title(head.title, props.title)}
        {props.right}
      </View>
    ) : (
      <View testID={rowId}>{title(head.title, props.title)}</View>
    );
  }
  return (
    <View
      testID={props.testID}
      style={{
        zIndex: 1,
        backgroundColor: head.bg,
        paddingTop: head.padding[0],
        paddingRight: head.padding[1],
        paddingBottom: head.padding[2],
        paddingLeft: head.padding[3],
      }}
    >
      {content}
      {props.children}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          // Just below the head (`top: 100%`).
          bottom: -head.fade.height,
          height: head.fade.height,
          ...gradientStyle(head.fade.gradient),
        }}
      />
    </View>
  );
}
