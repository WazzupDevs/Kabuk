import { ROUTES, type TabKey } from '@shared/navigation.ts';
import { router, useFocusEffect } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
} from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { haptic } from '@/lib/haptics';
import { useLeaveGuard } from '@/lib/leaveGuard';
import { V46_TAB_BAR, type V46TabKey } from '@/theme/parts.generated';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { TAB_BAR_GLASS } from '@/ui/backdrop';
import { GlassTarget } from '@/ui/LiquidGlass';
import { TabBar as V46TabBar, type TabBarItem } from '@/ui/TabBar';

// The tabs' navigator and v46's bar (src/ui/TabBar.tsx): the bar floats 12 above the bottom (above
// the safe area), centred, and shows the focused tab's screen through its liquid glass. Each tab
// screen is a glass target (TabScene, the navigator's `screenLayout`); the bar is drawn outside
// them. Over the Keşfet map, which the glass cannot show, the bar is opaque.

// The tab of each route; other routes (the hidden index) have none.
const TAB_OF: Partial<Record<string, V46TabKey>> = {
  explore: 'explore',
  activities: 'activities',
  venue: 'venue',
  messages: 'messages',
  profile: 'profile',
};

// Screens that change the bar while focused: a DM hides it (its message bar sits at the bottom),
// the Keşfet map makes it opaque. Counters, so a screen that blurs late cannot undo the next one's
// request. `target` is the focused tab screen's glass id, the one the bar shows.
const useBarMode = create<{
  hidden: number;
  overMap: number;
  target: string | null;
}>(() => ({ hidden: 0, overMap: 0, target: null }));

function useBarModeWhileFocused(key: 'hidden' | 'overMap', on: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!on) return undefined;
      useBarMode.setState((s) => ({ [key]: s[key] + 1 }));
      return () => useBarMode.setState((s) => ({ [key]: s[key] - 1 }));
    }, [key, on]),
  );
}

export function useHideTabBar(): void {
  useBarModeWhileFocused('hidden', true);
}

export function useTabBarOverMap(on: boolean): void {
  useBarModeWhileFocused('overMap', on);
}

// How much room the bar takes at the bottom of a tab screen (Screen pads by it); none while hidden.
const TabBarSpaceContext = createContext(0);

export function useTabBarSpace(): number {
  return useContext(TabBarSpaceContext);
}

export function TabBarSpace({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const t = V46_TAB_BAR[scheme];
  const hidden = useBarMode((s) => s.hidden > 0);
  return (
    <TabBarSpaceContext.Provider
      value={hidden ? 0 : t.height + t.bottom + insets.bottom + SPACING[4]}
    >
      {children}
    </TabBarSpaceContext.Provider>
  );
}

type SceneNavigation = {
  isFocused: () => boolean;
  addListener: (type: 'focus', callback: () => void) => () => void;
};

// A tab screen as what the bar's glass shows (a GlassTarget on the screen's ground): the focused
// one is the bar's target.
export function TabScene({
  navigation,
  children,
}: {
  navigation: SceneNavigation;
  children: ReactElement;
}) {
  const { colors } = useTheme();
  const id = useId();
  useEffect(() => {
    const own = () => useBarMode.setState({ target: id });
    if (navigation.isFocused()) own();
    const off = navigation.addListener('focus', own);
    return () => {
      off();
      useBarMode.setState((s) => (s.target === id ? { target: null } : s));
    };
  }, [navigation, id]);
  return (
    // A plain ground when the bar has no glass (TAB_BAR_GLASS).
    TAB_BAR_GLASS ? (
      <GlassTarget targetId={id} style={{ flex: 1, backgroundColor: colors.canvas }}>
        {children}
      </GlassTarget>
    ) : (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>{children}</View>
    )
  );
}

// Keşfet · Aktiviteler · Mekan · Mesajlar · Profil. `opens` says which tab a press leads to (the
// Mekan tab without a table: Keşfet, opened by its route as the tab's listener did); every press
// that changes the tab is felt, the redirected one too (haptics.ts → tabChanged). An unread count
// is a dot on the icon (v46 `.tdot`), read out with the tab's name.
export function TabBar({
  state,
  descriptors,
  navigation,
  insets,
  opens,
}: BottomTabBarProps & { opens: (tab: TabKey) => TabKey }) {
  const { scheme } = useTheme();
  const hidden = useBarMode((s) => s.hidden > 0);
  const overMap = useBarMode((s) => s.overMap > 0);
  const target = useBarMode((s) => s.target);
  if (hidden) return null;

  const focused = state.routes[state.index];
  const tabs = state.routes.flatMap((route) => {
    const key = TAB_OF[route.name];
    const options = descriptors[route.key]?.options;
    if (!key || !options) return [];
    const label = options.title ?? route.name;
    const badge = options.tabBarBadge;
    const item: TabBarItem = {
      key,
      label,
      unread: badge !== undefined,
      testID: options.tabBarButtonTestID,
      accessibilityLabel:
        options.tabBarAccessibilityLabel ?? (badge !== undefined ? `${label}, ${badge}` : label),
    };
    return [{ route, item }];
  });

  const routeOf = (key: V46TabKey) => tabs.find((t) => t.item.key === key)?.route;
  const onPress = (key: V46TabKey) => {
    const pressed = routeOf(key);
    if (!pressed) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: pressed.key,
      canPreventDefault: true,
    });
    if (event.defaultPrevented) return;
    const opened = opens(key);
    const route = routeOf(opened);
    if (!route) return;
    const moves = route.key !== focused?.key;
    if (moves) haptic('tabChanged');
    if (opened !== key) router.navigate(ROUTES[opened]);
    else if (moves) navigation.navigate(route.name, route.params);
    else {
      // The tab already open: back to its first screen (Profil from Kapsül karakterler). A screen
      // with changes asks first (leaveGuard).
      const nested = route.state;
      const ask = useLeaveGuard.getState().ask;
      if (ask && nested?.key && (nested.index ?? 0) > 0) ask();
      else if (nested?.key && (nested.index ?? 0) > 0) {
        navigation.dispatch({ type: 'POP_TO_TOP', target: nested.key });
      }
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + V46_TAB_BAR[scheme].bottom,
        alignItems: 'center',
      }}
    >
      <V46TabBar
        items={tabs.map((t) => t.item)}
        selected={focused ? (TAB_OF[focused.name] ?? null) : null}
        onPress={onPress}
        glassTarget={target}
        opaque={overMap}
      />
    </View>
  );
}
