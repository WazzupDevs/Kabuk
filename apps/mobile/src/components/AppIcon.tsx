import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

import type { IconName } from './Button';
import {
  type CanvasBarIcon,
  type CanvasLineIcon,
  type CanvasTone,
  CanvasBar,
  CanvasLine,
} from './CanvasIcon';

// Every icon of the app (the owner's call, 27 Ekim: the canvas's icon families everywhere). The
// app names an icon as before (Ionicons' names); one the skall tuvali draws comes from its families
// (docs/design/sistem/uretec/lib.cjs): a line icon (I) in the asked colour, or an action's two-tone
// bar icon (B) in the tone the colour stands for. An icon the canvas has no drawing for stays
// Ionicons' until the canvas draws it.
const LINE: Partial<Record<IconName, CanvasLineIcon>> = {
  'chevron-back': 'back',
  'chevron-forward': 'chev',
  'chevron-down': 'down',
  close: 'close',
  search: 'search',
  'search-outline': 'search',
  'exit-outline': 'exit',
  location: 'pin',
  'location-outline': 'pin',
  people: 'people',
  'people-outline': 'people',
  'time-outline': 'clock',
  'create-outline': 'edit',
  pencil: 'edit',
  refresh: 'refresh',
  'refresh-outline': 'refresh',
  'checkmark-done': 'read',
  checkmark: 'check',
  'compass-outline': 'compass',
  'chatbubble-outline': 'chat',
  'chatbubbles-outline': 'chat',
  'chatbubble-ellipses-outline': 'chat',
  person: 'person',
  'person-outline': 'person',
  'lock-closed-outline': 'lock',
  'information-circle-outline': 'info',
  'volume-mute-outline': 'mute',
  'ban-outline': 'block',
  'shield-outline': 'shield',
  'shield-checkmark-outline': 'shield',
  'document-text-outline': 'doc',
  'color-palette-outline': 'palette',
  'phone-portrait-outline': 'phone',
  'trash-outline': 'trash',
  'heart-outline': 'heart',
  'calendar-outline': 'calendar',
  'star-outline': 'star',
  'log-out-outline': 'logout',
  shuffle: 'shuffle',
  'arrow-forward': 'arrow',
  'eye-outline': 'eye',
};

const BAR: Partial<Record<IconName, CanvasBarIcon>> = {
  add: 'add',
  alert: 'report',
  'flag-outline': 'report',
  'ellipsis-vertical': 'more',
  'ellipsis-horizontal': 'more',
  'arrow-undo': 'reply',
  notifications: 'bell',
  'notifications-outline': 'bell',
  'camera-outline': 'photo',
  'images-outline': 'photo',
  'options-outline': 'settings',
  'megaphone-outline': 'lobby',
  send: 'send',
  list: 'list',
  'map-outline': 'map',
};

// The airy look's capsule icons (docs/design/aura → `.ci`; the owner's call, 28 Ekim): where the
// new canvas draws an icon, it wins over the earlier families.
const CAP: Partial<Record<IconName, CapIconName>> = {
  'chevron-back': 'back',
  'chevron-forward': 'forward',
  'arrow-forward': 'forward',
  close: 'close',
  add: 'plus',
  checkmark: 'check',
  'ellipsis-vertical': 'more',
  'ellipsis-horizontal': 'more',
  search: 'search',
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
  'calendar-outline': 'calendar',
  'compass-outline': 'compass',
  'options-outline': 'settings',
  'settings-outline': 'settings',
  shuffle: 'shuffle',
  list: 'list',
  'map-outline': 'map',
  // The menus' icons (the owner's report, 29 Ekim: one family for all of them).
  alert: 'report',
  'flag-outline': 'report',
  'ban-outline': 'block',
  'volume-mute-outline': 'mute',
  'shield-outline': 'shield',
  'shield-checkmark-outline': 'shield',
  'log-out-outline': 'logout',
  'exit-outline': 'logout',
  'trash-outline': 'trash',
  'document-text-outline': 'doc',
  refresh: 'refresh',
  'refresh-outline': 'refresh',
  'camera-outline': 'photo',
  'images-outline': 'photo',
  'eye-off-outline': 'eyeOff',
  'person-remove-outline': 'personRemove',
  // "Lobiye aç": the list, as on Masa's own button.
  'megaphone-outline': 'list',
};

export function canvasIconFor(name: IconName): 'line' | 'bar' | null {
  return LINE[name] ? 'line' : BAR[name] ? 'bar' : null;
}

export function AppIcon({
  name,
  size = ICON.md,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const cap = CAP[name];
  if (cap) return <CapIcon name={cap} color={color ?? colors.text} size={size} />;
  const bar = BAR[name];
  if (bar) {
    const tone: CanvasTone =
      color === colors.onPrimary
        ? 'onPrimary'
        : color === colors.danger
          ? 'negative'
          : color === colors.success
            ? 'positive'
            : 'neutral';
    return <CanvasBar name={bar} size={size} tone={tone} />;
  }
  const line = LINE[name];
  if (line) return <CanvasLine name={line} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
