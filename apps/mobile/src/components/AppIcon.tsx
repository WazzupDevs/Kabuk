import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

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
