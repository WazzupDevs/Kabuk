import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { withAlpha } from '@/theme/contrast';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';
// Frame by frame with the keyboard (react-native-keyboard-controller): the bar rises with it.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

// A timed screen on the stage (StageFit) turns the stage's scrolling off while it shows.
const StageFitContext = createContext<(change: 1 | -1) => void>(() => undefined);
// The height of a timed screen's middle, for pictures that size to it (İbre's dials).
const StageRoomContext = createContext<number | null>(null);

export function useStageRoom(): number | null {
  return useContext(StageRoomContext);
}

const SCRIM_OPACITY = 0.45;
// The chat panel covers most of the screen; the game stays visible above it.
const PANEL_HEIGHT = '78%';
const BADGE = SPACING[5];

type Props = {
  // The game's name over the stage ("Sesli Tabu").
  title: string;
  children: ReactNode;
  unread: number;
  chatOpen: boolean;
  onChat: (open: boolean) => void;
  // The room chat: the room's top bar, its messages and the message bar.
  chat: ReactNode;
  onEndGame: () => void;
  ending: boolean;
  endError: unknown;
  // One table: the other table sees nothing, the confirmation says so.
  solo: boolean;
  // Over everything (the "Süre bitti" overlay).
  overlay?: ReactNode;
  // Under the top row, outside the game: the other table's connection notice. It never lies over
  // the game's buttons.
  banner?: ReactNode;
};

// The running game, full screen (canvas: Aşama 6 · Oyunlar → Tam ekran oyun): no tab bar and no
// chat stream. The chat folds into a button with the unread count; it opens as a panel from the
// bottom. The keyboard only lifts the panel, so the game's buttons never move. "×" ends the game
// after a confirmation.
export function GameStage({
  title,
  children,
  unread,
  chatOpen,
  onChat,
  chat,
  onEndGame,
  ending,
  endError,
  solo,
  overlay,
  banner,
}: Props) {
  const { colors, shape } = useTheme();
  const [confirm, setConfirm] = useState(false);
  // How many timed screens are showing (StageFit): while any is, the stage stands still at its top.
  const [fitting, setFitting] = useState(0);
  const changeFit = useCallback((change: 1 | -1) => setFitting((n) => n + change), []);
  const fit = fitting > 0;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (fit) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [fit]);
  // The stage's visible height. A scroll view lets its content grow past the screen, so a timed
  // screen's middle would take its content's height and push the actions off the bottom; while one
  // shows, the content is held to exactly the screen.
  const [viewport, setViewport] = useState<number | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View
        className="flex-row items-center gap-2.5"
        style={{
          paddingHorizontal: shape.screenPadding - SPACING[1],
          paddingVertical: SPACING[1.5],
        }}
      >
        <RoundButton
          testID="end-game"
          label={tr.games.endGame}
          icon="close"
          onPress={() => setConfirm(true)}
        />
        <Text variant="heading" accessibilityRole="header" className="flex-1">
          {title}
        </Text>
        <View>
          <RoundButton
            testID="game-chat"
            label={tr.games.chatButton(unread)}
            icon="chatbubble-ellipses-outline"
            onPress={() => onChat(true)}
          />
          {unread > 0 ? (
            <View
              pointerEvents="none"
              className="absolute items-center justify-center"
              style={{
                top: -SPACING[0.5],
                right: -SPACING[0.5],
                minWidth: BADGE,
                height: BADGE,
                paddingHorizontal: SPACING[1],
                borderRadius: shape.radius.pill,
                backgroundColor: colors.danger,
              }}
            >
              <Text variant="caption" tone="onDanger">
                {unread > 99 ? '99+' : String(unread)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {banner ? (
        <View style={{ paddingHorizontal: shape.screenPadding - SPACING[1] }}>{banner}</View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ref={scroll}
        testID="game-stage"
        className="flex-1"
        scrollEnabled={!fit}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        contentContainerStyle={{
          flexGrow: 1,
          height: fit && viewport !== null ? viewport : undefined,
          paddingHorizontal: shape.screenPadding - SPACING[1],
          paddingTop: SPACING[2],
          paddingBottom: fit ? SPACING[2] : SPACING[6],
          gap: SPACING[3],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {endError ? (
          <Text variant="fine" tone="danger">
            {errorMessage(endError)}
          </Text>
        ) : null}
        <StageFitContext.Provider value={changeFit}>{children}</StageFitContext.Provider>
      </ScrollView>

      {overlay}

      {chatOpen ? (
        <View className="absolute inset-0">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr.common.close}
            onPress={() => onChat(false)}
            className="absolute inset-0"
            style={{ backgroundColor: withAlpha(colors.scrim, SCRIM_OPACITY) }}
          />
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1, justifyContent: 'flex-end' }}
            pointerEvents="box-none"
          >
            <SafeAreaView
              edges={['bottom']}
              testID="game-chat-panel"
              accessibilityViewIsModal
              style={{
                height: PANEL_HEIGHT,
                backgroundColor: colors.canvas,
                borderTopLeftRadius: shape.radius.lg,
                borderTopRightRadius: shape.radius.lg,
                overflow: 'hidden',
              }}
            >
              {chat}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirm}
        testID="end-game-confirm"
        title={tr.games.endGameConfirmTitle}
        body={solo ? tr.games.endGameConfirmSolo : tr.games.endGameConfirmBody}
        confirmLabel={tr.games.endGameConfirm}
        cancelLabel={tr.games.keepPlaying}
        danger
        pending={ending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onEndGame();
        }}
      />
    </SafeAreaView>
  );
}

// A timed game screen (CLAUDE.md → Ekran davranışı): the turn and clock on top, the prompt in the
// middle and the actions at the bottom are on screen together, without scrolling. Only the middle
// scrolls, and only when it is taller than the room left (a long card in large text).
export function StageFit({
  status,
  children,
  actions,
  testID,
}: {
  status?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  testID?: string;
}) {
  const changeFit = useContext(StageFitContext);
  useEffect(() => {
    changeFit(1);
    return () => changeFit(-1);
  }, [changeFit]);
  const [room, setRoom] = useState<number | null>(null);
  return (
    // Grows to the stage's height; never squeezed below its content (flex-1 would let the content
    // spill over its neighbours).
    <View style={{ flexGrow: 1, gap: SPACING[2.5] }} testID={testID}>
      {status}
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        // The cards' hard shadows need a little room inside the scroll's clip.
        style={{ marginHorizontal: -SPACING[1] }}
        onLayout={(e) => setRoom(Math.floor(e.nativeEvent.layout.height - SPACING[1] * 2))}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: SPACING[2],
          padding: SPACING[1],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <StageRoomContext.Provider value={room}>{children}</StageRoomContext.Provider>
      </ScrollView>
      {actions ? <View style={{ gap: SPACING[2] }}>{actions}</View> : null}
    </View>
  );
}

function RoundButton({
  testID,
  label,
  icon,
  onPress,
}: {
  testID: string;
  label: string;
  icon: 'close' | 'chatbubble-ellipses-outline';
  onPress: () => void;
}) {
  const { colors, shape } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: TOUCH.min,
            height: TOUCH.min,
            borderRadius: shape.radius.pill,
            backgroundColor: pressed ? colors.raised : colors.surface2,
          }}
        >
          <AppIcon name={icon} size={ICON.md} color={colors.text} />
        </View>
      )}
    </Pressable>
  );
}
