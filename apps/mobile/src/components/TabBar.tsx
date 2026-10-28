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
  useState,
} from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { AuraTabBar, type AuraTabItem } from '@/aura/AuraTabBar';
import { ARRIVE_RN, TabFocusContext, useSteppedBlur } from '@/aura/motion';
import { haptic } from '@/lib/haptics';
import { useLeaveGuard } from '@/lib/leaveGuard';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { AURA, MOTION } from '@/theme/aura';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { TAB_BAR_GLASS } from '@/ui/backdrop';
import { GlassTarget } from '@/ui/LiquidGlass';

// The tabs' navigator and the airy look's bar (src/aura/AuraTabBar.tsx, docs/design/aura): the bar
// floats above the bottom (above the safe area), centred, and shows the focused tab's screen
// through its liquid glass. Each tab
// screen is a glass target (TabScene, the navigator's `screenLayout`); the bar is drawn outside
// them. Over the Keşfet map, which the glass cannot show, the bar is opaque.

// The tab of each route; other routes (the hidden index) have none.
const TAB_OF: Partial<Record<string, TabKey>> = {
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
  const t = AURA.tabBar;
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
  addListener: (type: 'focus' | 'blur', callback: () => void) => () => void;
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
  const { scheme } = useTheme();
  const reduce = useReduceMotion();
  const id = useId();
  const [focus, setFocus] = useState({ focused: navigation.isFocused(), opened: 0 });
  // The tab's screen arrives each time it is opened (the film's tab switch): from a little below,
  // faded in on the native driver, its blur stepping down (useSteppedBlur). The first opening is
  // the screen's own arrival (Screen's cascade).
  const [p] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const own = () => useBarMode.setState({ target: id });
    if (navigation.isFocused()) own();
    const offFocus = navigation.addListener('focus', () => {
      own();
      setFocus((f) => ({ focused: true, opened: f.opened + 1 }));
      if (!reduce) {
        p.setValue(0);
        Animated.timing(p, {
          toValue: 1,
          duration: MOTION.dissolve.inMs,
          easing: ARRIVE_RN,
          useNativeDriver: true,
        }).start();
      }
    });
    const offBlur = navigation.addListener('blur', () =>
      setFocus((f) => ({ ...f, focused: false })),
    );
    return () => {
      offFocus();
      offBlur();
      useBarMode.setState((s) => (s.target === id ? { target: null } : s));
    };
  }, [navigation, id, reduce, p]);
  const blur = useSteppedBlur(focus.opened, !reduce);
  const arrive = {
    flex: 1,
    opacity: p,
    transform: [
      { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [MOTION.dissolve.rise, 0] }) },
    ],
    filter: blur > 0 ? [{ blur }] : undefined,
  };
  const ground = AURA[scheme].ground;
  const scene = (
    <TabFocusContext.Provider value={focus}>
      <Animated.View style={arrive}>{children}</Animated.View>
    </TabFocusContext.Provider>
  );
  return (
    // A plain ground when the bar has no glass (TAB_BAR_GLASS).
    TAB_BAR_GLASS ? (
      <GlassTarget targetId={id} style={{ flex: 1, backgroundColor: ground }}>
        {scene}
      </GlassTarget>
    ) : (
      <View style={{ flex: 1, backgroundColor: ground }}>{scene}</View>
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
    const item: AuraTabItem = {
      key,
      label,
      unread: badge !== undefined,
      testID: options.tabBarButtonTestID,
      accessibilityLabel:
        options.tabBarAccessibilityLabel ?? (badge !== undefined ? `${label}, ${badge}` : label),
    };
    return [{ route, item }];
  });

  const routeOf = (key: TabKey) => tabs.find((t) => t.item.key === key)?.route;
  const onPress = (key: TabKey) => {
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
        bottom: insets.bottom + AURA.tabBar.bottom,
        alignItems: 'center',
      }}
    >
      <AuraTabBar
        items={tabs.map((t) => t.item)}
        selected={focused ? (TAB_OF[focused.name] ?? null) : null}
        onPress={onPress}
        glassTarget={target}
        opaque={overMap}
      />
    </View>
  );
}
