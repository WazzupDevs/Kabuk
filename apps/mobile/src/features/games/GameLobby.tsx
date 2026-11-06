import { tableGame } from '@shared/gameFrame.ts';
import { Image } from 'expo-image';
import { type ComponentProps, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon } from '@/aura/CapIcon';
import { Btn, Chip, Glass, Round, T, Tag, useKit } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { RISO as R } from '@/theme/riso';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';

// Every game's pre-game page in one frame (the owner's call, 6 Kasım, round 3: the seven pages each
// had their own order). From the top: the close, the game's poster, its name and how many play, the
// chat; the game's rules as plain chips; then the game's own cards in this order: who plays (the
// players, or the teams and who has not chosen), the game's setup buttons (LobbyActions), the
// watchers (LobbyWatchers), how it plays (LobbyRules). The foot stays: a warning when the game
// cannot start yet, the hint, the owner's "Oyunu başlat". The body is still and scrolls only when it
// does not fit (the largest text). Vampir Köylü's page is the model (the owner's call).
export function GameLobby({
  testID,
  game,
  poster,
  name,
  close,
  onChat,
  chips,
  children,
  foot,
}: {
  testID: string;
  // The game's id on the server (content/games.json): its player range under the name.
  game: string;
  poster: ComponentProps<typeof Image>['source'];
  name: string;
  close: { label: string; onPress: () => void; loading?: boolean; testID: string };
  onChat?: () => void;
  chips: readonly (string | LobbyChip)[];
  children: ReactNode;
  foot: LobbyFootProps;
}) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const entry = tableGame(game);
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[3],
          paddingHorizontal: KIT.size.side,
          paddingBottom: SPACING[6],
          gap: KIT.size.rowGap,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}>
          <Round
            icon="close"
            label={close.label}
            loading={close.loading}
            onPress={close.onPress}
            testID={close.testID}
          />
          <Image
            source={poster}
            style={{
              width: R.poster.width,
              height: R.poster.height,
              borderRadius: R.poster.radius,
            }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1 }}>
            <T v="h3" lines={1} fit>
              {name}
            </T>
            {entry ? <T v="fine">{tr.games.range(entry.minPlayers, entry.maxPlayers)}</T> : null}
          </View>
          {onChat ? <Round icon="chat" label={tr.games.chat} onPress={onChat} /> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KIT.size.chipGap }}>
          {chips.map((c) =>
            typeof c === 'string' ? (
              <Tag key={c} label={c} />
            ) : (
              <Chip
                key={c.label}
                label={c.label}
                testID={c.testID}
                accessibilityLabel={c.accessibilityLabel}
                onPress={c.onPress}
              />
            ),
          )}
        </View>
        {children}
      </ScrollView>
      <LobbyFoot {...foot} />
    </View>
  );
}

// A rule the owner can change by tapping it (Kibrit's round count).
export type LobbyChip = {
  label: string;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

type LobbyFootProps = {
  owner: boolean;
  // Why the game cannot start yet (fewer players, no captains, few questions left): the warning,
  // and the owner's button waits.
  warning?: string | null;
  // The game starts with the warning on (Kaupholl's few questions left): only a note.
  canStart?: boolean;
  error?: unknown;
  start: { label: string; testID: string; loading: boolean; busy?: boolean; onPress: () => void };
};

// The foot: the error, the warning, the hint ("Herkes hazırsa oyunu başlat." for the owner, "Oyunu
// masa sahibi başlatır." for the others) and the owner's "Oyunu başlat".
function LobbyFoot({ owner, warning, canStart, error, start }: LobbyFootProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ready = canStart ?? !warning;
  return (
    <View
      style={{
        paddingHorizontal: KIT.size.side,
        paddingTop: SPACING[2],
        paddingBottom: insets.bottom + SPACING[4],
        gap: SPACING[2],
      }}
    >
      {error ? (
        <T v="fine" color={KIT.danger} center>
          {errorMessage(error)}
        </T>
      ) : null}
      {warning ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: R.warn.gap,
            paddingVertical: R.warn.padY,
            paddingHorizontal: R.warn.padX,
            borderRadius: R.warn.radius,
            backgroundColor: colors.warnSoft,
          }}
        >
          <CapIcon name="warn" color={colors.onWarnSoft} />
          <View style={{ flex: 1 }}>
            <T v="fine" strong color={colors.onWarnSoft}>
              {warning}
            </T>
          </View>
        </View>
      ) : null}
      {!owner ? (
        <T v="fine" center>
          {tr.games.hintGuest}
        </T>
      ) : ready ? (
        <T v="fine" center>
          {tr.games.hintOwner}
        </T>
      ) : null}
      {owner ? (
        <Btn
          block
          testID={start.testID}
          label={start.label}
          disabled={!ready || !!start.busy}
          loading={start.loading}
          onPress={start.onPress}
        />
      ) : null}
    </View>
  );
}

// A card of the page: its title, at the right a count or a button, then what it holds.
export function LobbyCard({
  title,
  note,
  count,
  right,
  icon,
  children,
  testID,
}: {
  title: string;
  note?: string;
  count?: string;
  right?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  testID?: string;
}) {
  return (
    <Glass pad="pad" style={{ gap: KIT.size.rowGap }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: KIT.size.rowGap }}>
        {icon}
        <View style={{ flex: 1 }}>
          <T v="h3">{title}</T>
          {note ? <T v="fine">{note}</T> : null}
        </View>
        {count ? <T v="fine">{count}</T> : null}
        {right}
      </View>
      {children}
    </Glass>
  );
}

export type LobbyPerson = {
  key: string;
  face: ReactNode;
  name: string;
  // Sprengja's throwing order.
  mark?: string;
  me?: boolean;
};

// The people in two even columns, the same in every count (Vampir Köylü's list, the owner's report,
// 29 Ekim; every game's, the owner's call, 6 Kasım, round 3).
export function LobbyPeople({ people }: { people: readonly LobbyPerson[] }) {
  const { colors } = useTheme();
  if (people.length === 0) return null;
  const rows: LobbyPerson[][] = [];
  for (let i = 0; i < people.length; i += 2) rows.push(people.slice(i, i + 2));
  return (
    <View style={{ gap: LIST_GAP }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: KIT.size.rowGap }}>
          {[0, 1].map((j) => {
            const p = row[j];
            return (
              <View
                key={j}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: PERSON_GAP }}
              >
                {p ? (
                  <>
                    {p.mark ? (
                      <T v="fine" strong ink={!p.me} color={p.me ? colors.accent : undefined}>
                        {p.mark}
                      </T>
                    ) : null}
                    {p.face}
                    <View style={{ flex: 1 }}>
                      <T v="fine" strong ink lines={1} fit>
                        {p.name}
                      </T>
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const LIST_GAP = 10;
const PERSON_GAP = 8;

// The game's setup buttons (Karıştır, Kaptanları seç, Kelime kuralları): one row of halves.
export function LobbyActions({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: KIT.size.rowGap }}>{children}</View>;
}

// Gözlemciler: what a watcher sees, "Gözlemci ol" (or "Oyna"), and who watches.
export function LobbyWatchers({
  note,
  watching,
  loading,
  onPress,
  testID,
  people,
  disabled,
}: {
  note: string;
  watching: boolean;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID: string;
  people: readonly LobbyPerson[];
}) {
  const { c } = useKit();
  return (
    <LobbyCard
      title={tr.games.watchers}
      note={note}
      icon={<CapIcon name="eye" color={c.ink} />}
      right={
        <Btn
          sm
          variant="glassy"
          testID={testID}
          label={watching ? tr.games.play : tr.games.watch}
          disabled={disabled}
          loading={loading}
          onPress={onPress}
        />
      }
    >
      {people.length > 0 ? <LobbyPeople people={people} /> : null}
    </LobbyCard>
  );
}

// How it plays: the words, a fainter note under them.
export function LobbyRules({ text, note }: { text: string; note?: string }) {
  return (
    <Glass pad="pad" style={{ gap: KIT.size.rowGap }}>
      <T v="fine" ink>
        {text}
      </T>
      {note ? <T v="fine">{note}</T> : null}
    </Glass>
  );
}
