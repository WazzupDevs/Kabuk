import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { T } from '@/aura/kit';
import { KIT } from '@/theme/auraKit';
import { useTheme } from '@/theme/ThemeProvider';
import { LOCATE_SHEET as L } from '@/theme/venueDetail';

// The location sheet's notice (yeni arayüz tuvali, MekanKonumIzin `.nb2.dg`, MekanKonumDisari
// `.nb2.wn`): an icon, a title over its words, in the soft red (permission off) or the soft amber
// (outside the venue). Read as one line by a screen reader, "title. words".
export function LocateNotice({
  tone,
  title,
  body,
}: {
  tone: 'danger' | 'warn';
  title: string;
  body: string;
}) {
  const { scheme } = useTheme();
  const k = KIT[scheme];
  const danger = tone === 'danger';
  const bg = danger ? k.stripDanger : k.stripWarn;
  const ink = danger ? k.onStripDanger : k.onStripWarn;
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body}`}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: L.noticeGap,
        paddingHorizontal: L.noticePad.x,
        paddingVertical: L.noticePad.y,
        borderRadius: KIT.size.glassRadiusSm,
        backgroundColor: bg,
      }}
    >
      <CapIcon name={danger ? 'lock' : 'warn'} color={ink} size={L.noticeIcon} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T v="locateNoticeTitle" color={ink}>
          {title}
        </T>
        <T v="locateNotice" color={ink}>
          {body}
        </T>
      </View>
    </View>
  );
}
