import { tableGame } from '@shared/gameFrame.ts';
import { Image } from 'expo-image';
import { type ComponentProps, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuraBackground } from '@/aura/AuraBackground';
import { CapIcon, type CapIconName } from '@/aura/CapIcon';
import { Btn, Chip, Round, T, useKit } from '@/aura/kit';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNarrow } from '@/lib/useNarrow';
import { AURA } from '@/theme/aura';
import { KIT } from '@/theme/auraKit';
import { TEAM_TONES, type Team } from '@/theme/gameColors';
import { LOBBY, LOBBY_COLORS } from '@/theme/lobby';
import { useTheme } from '@/theme/ThemeProvider';
import { SPACING } from '@/theme/tokens';
import { VENUE } from '@/theme/venue';

// Every game's pre-game page in one frame (the owner's call, 6 Kasım, round 3; the new interface
// boards OyunLobi, OyunLobiGozlemci, TakimLobi, DarOyunLobi, 16 Kasım). The head stays (the close,
// the game's poster, its name and how many play, the chat; the top buttons never scroll, CLAUDE.md
// → Ekran davranışı); under it the game's rules as plain chips, then the game's own sections in
// this order: who plays (the players, or the teams and who has not chosen), the game's setup
// buttons (LobbyActions), the watchers (LobbyWatchers), how it plays (LobbyRules). The foot stays:
// a warning when the game cannot start yet, the hint, the owner's "Oyunu başlat". The body is still
// and scrolls only when it does not fit (the largest text).
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
  const H = LOBBY.head;
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: AURA[scheme].ground }}>
      <AuraBackground />
      {/* The head (`.lt`). */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: H.gap,
          paddingTop: insets.top + H.top,
          paddingHorizontal: H.side,
        }}
      >
        <Round
          icon="close"
          label={close.label}
          loading={close.loading}
          onPress={close.onPress}
          testID={close.testID}
        />
        <Image
          source={poster}
          style={{ width: H.posterW, height: H.posterH, borderRadius: H.posterRadius }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="lobbyName" ink lines={1} fit accessibilityRole="header">
            {name}
          </T>
          {entry ? <T v="fine">{tr.games.range(entry.minPlayers, entry.maxPlayers)}</T> : null}
        </View>
        {onChat ? <Round icon="chat" label={tr.games.chat} onPress={onChat} /> : null}
      </View>
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: LOBBY.body.top,
          paddingHorizontal: KIT.size.side,
          paddingBottom: SPACING[6],
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: LOBBY.chip.gap }}>
          {chips.map((c) =>
            typeof c === 'string' ? (
              <RuleChip key={c} label={c} />
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

// A rule (`.tgs span`): 26 high, muted words on a faint ground.
function RuleChip({ label }: { label: string }) {
  const { scheme } = useTheme();
  return (
    <View
      style={{
        minHeight: LOBBY.chip.height,
        paddingHorizontal: LOBBY.chip.padX,
        borderRadius: LOBBY.chip.height / 2,
        justifyContent: 'center',
        backgroundColor: LOBBY_COLORS[scheme].soft,
      }}
    >
      <T v="tag">{label}</T>
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

// The foot (`.lf`): the error, the warning (`.wr`: its icon and words in the warning's ink), the
// hint ("Herkes hazırsa oyunu başlat." for the owner, "Oyunu masa sahibi başlatır." for the others)
// and the owner's long "Oyunu başlat".
function LobbyFoot({ owner, warning, canStart, error, start }: LobbyFootProps) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const ready = canStart ?? !warning;
  const F = LOBBY.foot;
  return (
    <View
      style={{
        paddingHorizontal: KIT.size.side,
        paddingTop: F.top,
        paddingBottom: insets.bottom + SPACING[4],
        gap: F.gap,
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
            justifyContent: 'center',
            gap: F.warnGap,
          }}
        >
          <CapIcon name="warn" color={LOBBY_COLORS[scheme].warn} size={F.warnIcon} />
          <View style={{ flexShrink: 1 }}>
            <T v="fine" strong color={LOBBY_COLORS[scheme].warn} center>
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

// A section of the page (`.sh`): its heading, at the right a count or a button, a note under it,
// then what it holds.
export function LobbyCard({
  title,
  note,
  count,
  right,
  children,
  testID,
}: {
  title: string;
  note?: string;
  count?: string;
  right?: ReactNode;
  children?: ReactNode;
  testID?: string;
}) {
  const S = LOBBY.section;
  return (
    <View testID={testID} style={{ marginTop: S.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: KIT.size.rowGap,
          marginBottom: note ? 0 : S.bottom,
        }}
      >
        <View style={{ flex: 1 }}>
          <T v="roomSection" ink accessibilityRole="header">
            {title}
          </T>
        </View>
        {count ? <T v="roomCount">{count}</T> : null}
        {right}
      </View>
      {note ? (
        <T v="fine" style={{ marginTop: S.noteTop, marginBottom: S.noteBottom }}>
          {note}
        </T>
      ) : null}
      {children}
    </View>
  );
}

export type LobbyPerson = {
  key: string;
  face: ReactNode;
  name: string;
  // Sprengja's throwing order.
  mark?: string;
  me?: boolean;
  // The table's owner: "Masa sahibi" under the name.
  owner?: boolean;
};

// The people in two even columns, the same in every count (Vampir Köylü's list, the owner's report,
// 29 Ekim; every game's, the owner's call, 6 Kasım, round 3), a hairline over each row from the
// second (`.pg2`); one column at 320 dp or the largest text (DarOyunLobi), and in a team's box
// (`single`). `small`: the faces 28 (a team's list, those who have not chosen). `quiet`: the
// watchers, their faces faded and their names muted (`.og`).
export function LobbyPeople({
  people,
  single,
  small,
  quiet,
}: {
  people: readonly LobbyPerson[];
  single?: boolean;
  small?: boolean;
  quiet?: boolean;
}) {
  const { colors, scheme } = useTheme();
  const narrow = useNarrow();
  if (people.length === 0) return null;
  const P = LOBBY.people;
  const perRow = single || narrow ? 1 : 2;
  const rows: LobbyPerson[][] = [];
  for (let i = 0; i < people.length; i += perRow) rows.push(people.slice(i, i + perRow));
  const face = small ? P.smallFace : P.face;
  const min = single ? LOBBY.teamList.person : quiet ? P.quietMin : P.min;
  return (
    <View style={{ marginTop: quiet ? P.quietTop : 0 }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', columnGap: P.colGap }}>
          {Array.from({ length: perRow }, (_, j) => {
            const p = row[j];
            return (
              <View key={j} style={{ flex: 1, minWidth: 0 }}>
                {p && i > 0 && !single ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: face + P.hairPast,
                      right: 0,
                      height: KIT.size.hair,
                      backgroundColor: KIT.layer[scheme].menuHair,
                    }}
                  />
                ) : null}
                {p ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: P.gap,
                      minHeight: min,
                    }}
                  >
                    {p.mark ? (
                      <T v="fine" strong ink={!p.me} color={p.me ? colors.accent : undefined}>
                        {p.mark}
                      </T>
                    ) : null}
                    <View style={{ opacity: quiet ? P.quietFace : 1 }}>{p.face}</View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v={quiet ? 'lobbyQuiet' : 'lobbyPerson'} ink={!quiet} lines={1} fit>
                        {p.name}
                      </T>
                      {p.owner ? (
                        <T v="roomOwner" color={VENUE[scheme].here.ink} lines={1} fit>
                          {tr.table.ownerTag}
                        </T>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// The game's setup buttons (Kaptanları seç, Kelime kuralları): one row of halves.
export function LobbyActions({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: KIT.size.rowGap, marginTop: KIT.size.rowGap }}>
      {children}
    </View>
  );
}

// The two teams side by side (`.tgr`), one over the other at 320 dp or the largest text.
export function LobbyTeams({ right, children }: { right?: ReactNode; children: ReactNode }) {
  const narrow = useNarrow();
  return (
    <LobbyCard title={tr.games.teams} right={right}>
      <View
        style={{
          flexDirection: narrow ? 'column' : 'row',
          gap: LOBBY.team.gap,
          marginTop: LOBBY.team.top - LOBBY.section.bottom,
        }}
      >
        {children}
      </View>
    </LobbyCard>
  );
}

// A team's box (`.tc`): the team's colour faint under it; its bar, name and headcount; its people
// one under the other; "Katıl" in the team's colour, or "Takımdasın" once joined.
export function LobbyTeam({
  team,
  title,
  count,
  joined,
  join,
  children,
}: {
  team: Team;
  title: string;
  count: string;
  joined: boolean;
  join: { label: string; testID: string; loading: boolean; disabled: boolean; onPress: () => void };
  children: ReactNode;
}) {
  const { scheme } = useTheme();
  const narrow = useNarrow();
  const tone = TEAM_TONES[scheme][team];
  const B = LOBBY.team;
  return (
    <View
      style={{
        // Side by side the two share the row; one over the other each its own height.
        flex: narrow ? undefined : 1,
        padding: B.pad,
        gap: B.inner,
        borderRadius: B.radius,
        backgroundColor: LOBBY_COLORS[scheme].team[team],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: LOBBY.teamList.gap }}>
        <View
          style={{
            width: B.barW,
            height: B.barH,
            borderRadius: B.barRadius,
            backgroundColor: tone.color,
          }}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="lobbyTeam" ink lines={1} fit accessibilityRole="header">
            {title}
          </T>
        </View>
        <T v="lobbyTeamCount" color={tone.color}>
          {count}
        </T>
      </View>
      <View style={{ minHeight: LOBBY.teamList.min }}>{children}</View>
      {joined ? (
        <View
          testID={`${join.testID}-in`}
          style={{ minHeight: KIT.size.btnSm, alignItems: 'center', justifyContent: 'center' }}
        >
          <T v="fine" strong color={tone.color} center>
            {tr.games.inTeam}
          </T>
        </View>
      ) : (
        <Btn
          sm
          block
          testID={join.testID}
          label={join.label}
          fill={tone.fill}
          tint={tone.onFill}
          disabled={join.disabled}
          loading={join.loading}
          onPress={join.onPress}
        />
      )}
    </View>
  );
}

// A row of the page (`.lr`): a hairline over it, its disc and icon, its title and line, at the right
// what it does.
function LobbyRow({
  icon,
  title,
  line,
  note,
  right,
  first,
}: {
  icon: CapIconName;
  title: string;
  line: string;
  note?: string;
  right?: ReactNode;
  first?: boolean;
}) {
  const { c } = useKit();
  const { scheme } = useTheme();
  const W = LOBBY.row;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: W.gap,
        minHeight: W.min,
        paddingVertical: SPACING[2],
        marginTop: first ? W.first : 0,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: W.hairIn,
          right: 0,
          height: KIT.size.hair,
          backgroundColor: KIT.layer[scheme].menuHair,
        }}
      />
      <View
        style={{
          width: W.disc,
          height: W.disc,
          borderRadius: W.disc / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LOBBY_COLORS[scheme].soft,
        }}
      >
        <CapIcon name={icon} color={c.ink} size={W.icon} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="lobbyRow" ink>
          {title}
        </T>
        <T v="fine">{line}</T>
        {note ? <T v="fine">{note}</T> : null}
      </View>
      {right}
    </View>
  );
}

// Gözlemciler: what a watcher sees, "Gözlemci ol" (or "Oyuna katıl"), and who watches.
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
  return (
    <View>
      <LobbyRow
        first
        icon="eye"
        title={tr.games.watchers}
        line={note}
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
      />
      {people.length > 0 ? <LobbyPeople people={people} quiet /> : null}
    </View>
  );
}

// How it plays (`.lr`): "Nasıl oynanır", the words under it, a fainter note under them.
export function LobbyRules({ text, note }: { text: string; note?: string }) {
  return <LobbyRow icon="doc" title={tr.games.how} line={text} note={note} />;
}
