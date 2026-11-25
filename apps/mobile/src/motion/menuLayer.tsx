import {
  createContext,
  useEffect,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, BackHandler, Modal, StyleSheet, View } from 'react-native';

import { useLeaveKeyboard } from '@/lib/modalKeyboard';

// The layer the menus grown from a button draw in (Menu → MenuPop): over the screens, in the app's
// own window. A Modal is a window of its own, and Android builds it as the menu opens: the menu
// stood still about 160 ms before it began to grow (the owner's report, 21 Kasım; Telegram Android
// draws its popup menus in the activity's own window). Outside a layer (a screen with none) the
// menu falls back to its Modal.
type Show = (id: number, node: ReactNode | null) => void;
const MenuLayerContext = createContext<Show | null>(null);

export function MenuLayer({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<ReadonlyMap<number, ReactNode>>(new Map());
  const show = useCallback<Show>((id, node) => {
    setNodes((now) => {
      if (node === null && !now.has(id)) return now;
      const next = new Map(now);
      if (node === null) next.delete(id);
      else next.set(id, node);
      return next;
    });
  }, []);
  return (
    <MenuLayerContext.Provider value={show}>
      {children}
      {nodes.size > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {[...nodes].map(([id, node]) => (
            <View key={id} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {node}
            </View>
          ))}
        </View>
      ) : null}
    </MenuLayerContext.Provider>
  );
}

let nextId = 1;

// Draws `node` in the nearest MenuLayer while it is not null; false when there is no layer (the
// caller draws it itself then).
export function useMenuLayer(node: ReactNode | null): boolean {
  const show = useContext(MenuLayerContext);
  const id = useMemo(() => nextId++, []);
  const last = useRef<Show | null>(null);
  useLayoutEffect(() => {
    if (!show) return;
    last.current = show;
    show(id, node);
  });
  useLayoutEffect(
    () => () => {
      last.current?.(id, null);
    },
    [id],
  );
  return show !== null;
}

// What opens over a screen (a menu, a sheet, a held message, a photo, a request): drawn in the
// nearest MenuLayer while `visible`, Android's back calling `onBack`; outside a layer, a Modal (the
// one place that builds one; CLAUDE.md → Çizim bütçesi). `fade`: it comes in over 150 ms (the
// Modal's own fade it had before).
export function Layer({
  visible,
  onBack,
  fade,
  children,
}: {
  visible: boolean;
  onBack?: () => void;
  fade?: boolean;
  children: ReactNode;
}) {
  // The keyboard goes away as it opens, as for every layer (lib/modalKeyboard.ts).
  useLeaveKeyboard(visible);
  const body = fade ? <FadeIn>{children}</FadeIn> : children;
  const inLayer = useMenuLayer(visible ? body : null);
  useEffect(() => {
    if (!inLayer || !visible || !onBack) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [inLayer, visible, onBack]);
  if (inLayer) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBack ?? noop}
    >
      {body}
    </Modal>
  );
}

const FADE_MS = 150;

function FadeIn({ children }: { children: ReactNode }) {
  const [o] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const run = Animated.timing(o, { toValue: 1, duration: FADE_MS, useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [o]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: o }]}>{children}</Animated.View>
  );
}

function noop() {}
