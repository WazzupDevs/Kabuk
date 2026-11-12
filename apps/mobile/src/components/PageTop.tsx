import { type ReactNode, useContext } from 'react';
import { View } from 'react-native';

import { LargeTitle, type LargeTitleLook, PageTopPart, TopBarRow } from '@/motion/TopBar';
import { SPACING } from '@/theme/tokens';

// A page's top (docs/design/iskelet.md → 3.1, the `sayfa` bar: Arkadaşlar, Bildirim ayarları,
// Gizlilik, Hesap…): the 46 glass back button on the bar, something on the right, and the 34/800
// large title under it. It goes in Screen → `top`. On a scrolling page the bar stays and the title
// scrolls with the content, fading over 5 to 50 while the bar's band comes in and its small centred
// title over 40 to 70 (Screen draws each part where it goes, PageTopPart). On a still page the band
// never shows and the title stays in place.
export function PageTop({
  title,
  sub,
  onBack,
  trailing,
  look,
}: {
  title: string;
  // Under the title, quieter (skall tuvali, Arkadaslar: "4 arkadaş").
  sub?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  // A board's own large title (tuval Arkadaslar, Duzenle: 34/800 at -0.035em, in from the page's
  // side, the line under it 14/600); the kit's otherwise.
  look?: LargeTitleLook;
}) {
  const part = useContext(PageTopPart);
  const row = <TopBarRow kind="sayfa" title={title} onBack={onBack} trailing={trailing} />;
  const head = <LargeTitle kind="sayfa" title={title} sub={sub} look={look} />;
  if (part === 'bar') return row;
  if (part === 'title') return head;
  return (
    <View style={{ gap: SPACING[3] }}>
      {row}
      {head}
    </View>
  );
}
