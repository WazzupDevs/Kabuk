import { View } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

// Every icon of the app comes from the one capsule family (Aura v65, U6: Ikonlar, IkonlarYeni,
// IkonlarRevize; aura/CapIcon.tsx). There is no other family and no Ionicons fallback. A screen
// names an icon by its capsule name, or by the earlier name it used, which maps to its capsule
// drawing here (IkonlarYeni → "Tek aileye geçiş").
const LEGACY = {
  'chevron-back': 'back',
  'chevron-forward': 'chevron',
  'chevron-down': 'down',
  'arrow-forward': 'forward',
  'arrow-undo': 'reply',
  add: 'plus',
  checkmark: 'check',
  'checkmark-done': 'read',
  'checkmark-circle': 'checkCircle',
  'ellipsis-vertical': 'moreV',
  'ellipsis-horizontal': 'more',
  'search-outline': 'search',
  location: 'pin',
  'location-outline': 'pin',
  notifications: 'bell',
  'notifications-outline': 'bell',
  'chatbubble-outline': 'chat',
  'chatbubbles-outline': 'chat',
  'chatbubble-ellipses-outline': 'chat',
  person: 'user',
  'person-outline': 'user',
  'person-add-outline': 'invite',
  'person-remove-outline': 'userMinus',
  'person-circle-outline': 'personCircle',
  'people-outline': 'people',
  'time-outline': 'clock',
  'create-outline': 'edit',
  pencil: 'edit',
  'refresh-outline': 'refresh',
  'calendar-outline': 'calendar',
  'compass-outline': 'compass',
  'options-outline': 'settings',
  'settings-outline': 'settings',
  'map-outline': 'map',
  alert: 'flag',
  'flag-outline': 'flag',
  'ban-outline': 'block',
  'volume-mute-outline': 'mute',
  'shield-outline': 'shield',
  'shield-checkmark-outline': 'shield',
  'log-out-outline': 'logout',
  'exit-outline': 'logout',
  'trash-outline': 'trash',
  'document-text-outline': 'doc',
  'camera-outline': 'camera',
  'images-outline': 'gallery',
  'eye-outline': 'eye',
  'eye-off-outline': 'eyeOff',
  'lock-closed-outline': 'lock',
  'information-circle-outline': 'info',
  'color-palette-outline': 'palette',
  'phone-portrait-outline': 'phone',
  'heart-outline': 'heart',
  'star-outline': 'star',
  'cloud-offline-outline': 'cloudOff',
  'cafe-outline': 'cafe',
  'sparkles-outline': 'sparkles',
  'copy-outline': 'copy',
  'information-circle': 'info',
  // A table's anonymous identity (MekanSecenekler: personCircle beside user).
  'happy-outline': 'personCircle',
  // "Lobiye aç": the list, as on Masa's own button.
  'megaphone-outline': 'list',
} as const satisfies Record<string, CapIconName>;

// A warning's exclamation: the info icon turned over, as the canvas draws it (its own drawing is an
// open decision, report §12.5).
const TURNED = { warning: 'info', 'alert-circle': 'info' } as const satisfies Record<
  string,
  CapIconName
>;

export type IconName = CapIconName | keyof typeof LEGACY | keyof typeof TURNED;

export function capIconName(name: IconName): CapIconName {
  if (name in TURNED) return TURNED[name as keyof typeof TURNED];
  return name in LEGACY ? LEGACY[name as keyof typeof LEGACY] : (name as CapIconName);
}

export function AppIcon({
  name,
  size = ICON.md,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const icon = <CapIcon name={capIconName(name)} color={color ?? colors.text} size={size} />;
  return name in TURNED ? <View style={{ transform: [{ rotate: '180deg' }] }}>{icon}</View> : icon;
}
