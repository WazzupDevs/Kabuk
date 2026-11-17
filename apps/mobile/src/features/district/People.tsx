import type { DistrictPerson } from '@shared/api/district.ts';
import { View } from 'react-native';

import { Av, T, useKit } from '@/aura/kit';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Loader, useLoaderHold } from '@/components/Loader';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useNow } from '@/lib/useNow';
import { KIT } from '@/theme/auraKit';
import { SEMT } from '@/theme/semt';
import { useTheme } from '@/theme/ThemeProvider';

import { useDistrictPeople } from './queries';

const P = SEMT.people;
// "12 dk önce geldi" moves once a minute.
const TICK_MS = 60_000;

// Odadakiler (yeni arayüz tuvali: Odadakiler, OdaProfilli, OdaUzun, OdaTek, DarOdadakiler; §4.V):
// the room's people now, from `district-chat/people`. The viewer first ("Sen"), then the profiled
// (name, age, face; "Arkadaşın" and "Sessize aldın" after the time), then the anonymous: a time and
// nothing else, no nick, no look, no friend mark. No row is pressed: no profile opens and there is
// no row menu (OdaMenu is not taken, davranis-eksikleri.md). A tap outside, a pull, the close
// button and Android's back close the sheet; Seçenekler does not open again (yeni-tuval.md).
export function PeopleSheet({
  visible,
  onClose,
  district,
}: {
  visible: boolean;
  onClose: () => void;
  district: string;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={tr.district.people.title}>
      {/* The query lives in the body: it mounts at every opening and is gone with the sheet. */}
      <PeopleBody district={district} />
    </Sheet>
  );
}

function PeopleBody({ district }: { district: string }) {
  const { c } = useKit();
  const people = useDistrictPeople();
  const now = useNow(TICK_MS);
  const holding = useLoaderHold(people.isPending);
  const data = people.data;
  if (people.isError && !data)
    return (
      <EmptyState
        kind="error"
        compact
        body={errorMessage(people.error)}
        action={{
          label: tr.common.retry,
          onPress: () => void people.refetch(),
          loading: people.isFetching,
        }}
      />
    );
  if (!data || holding) return <Loader />;
  const alone = data.profiled.length === 0 && data.anonymous.length === 0;
  return (
    <View testID="district-people" accessibilityLabel={tr.district.people.list}>
      <T v="fine" color={c.muted}>
        {tr.district.people.sub(district, data.count)}
      </T>
      <View style={{ marginTop: P.top }}>
        {data.me ? <Row person={data.me} now={now} self /> : null}
        {alone ? (
          <EmptyState
            kind="empty"
            compact
            title={tr.district.people.emptyTitle}
            body={tr.district.people.emptyBody}
          />
        ) : null}
        {data.profiled.length > 0 ? (
          <>
            <Label>{tr.district.people.profiledGroup(data.profiled.length)}</Label>
            {data.profiled.map((p, i) => (
              <Row key={i} person={p} now={now} />
            ))}
          </>
        ) : null}
        {data.anonymous.length > 0 ? (
          <>
            <Label>{tr.district.people.anonymousGroup(data.anonymous.length)}</Label>
            {data.anonymous.map((p, i) => (
              <Row key={i} person={p} now={now} />
            ))}
          </>
        ) : null}
      </View>
    </View>
  );
}

function Label({ children }: { children: string }) {
  const { c } = useKit();
  return (
    <View
      style={{ marginTop: P.labelTop, marginBottom: P.labelBottom, paddingHorizontal: P.labelX }}
    >
      <T v="tag" color={c.muted} accessibilityRole="header">
        {children}
      </T>
    </View>
  );
}

// One row, never pressable. The viewer's own anonymous row wears the own capsule (the phone's own
// look); another anonymous row wears the plain mark, the same for everyone.
function Row({
  person,
  now,
  self = false,
}: {
  person: DistrictPerson;
  now: number;
  self?: boolean;
}) {
  const { c } = useKit();
  const { colors } = useTheme();
  const look = useOwnLook();
  const text = tr.district.people;
  const time = person.joinedAt ? text.joined(person.joinedAt, now) : null;
  const name = person.profiled ? (person.displayName ?? text.someone) : null;
  const title = self
    ? text.you
    : person.profiled
      ? text.nameAge(name ?? text.someone, person.age)
      : text.anonymous;
  const note = self
    ? person.profiled
      ? text.youProfiled
      : text.youAnonymous
    : [
        time,
        person.profiled && person.friend ? text.friend : null,
        person.profiled && person.muted ? text.muted : null,
      ]
        .filter((part): part is string => part !== null)
        .join(` ${tr.common.separator} `);
  const side = KIT.size.av.row;
  const face = person.profiled ? (
    <Av size="row" name={name ?? text.someone} photoUrl={person.photoUrl} />
  ) : self && look ? (
    <Av size="row" name={text.anonymous}>
      <LookAvatar look={look} size={side} />
    </Av>
  ) : (
    <Avatar kind="default" size="lg" />
  );
  return (
    <View
      accessible
      accessibilityLabel={note ? `${title}, ${note}` : title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: P.gap,
        paddingVertical: P.padY,
        paddingHorizontal: P.padX,
      }}
    >
      {/* The ring sits outside the face's box: the words stay in line with the other rows'. */}
      <View
        style={
          self
            ? {
                margin: -P.ring,
                borderRadius: (side + 2 * P.ring) / 2,
                borderWidth: P.ring,
                borderColor: colors.accent,
              }
            : undefined
        }
      >
        {face}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="dmName" ink>
          {title}
        </T>
        {note ? (
          <T v="fine" color={c.muted}>
            {note}
          </T>
        ) : null}
      </View>
    </View>
  );
}
