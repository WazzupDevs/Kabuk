import type { Friend } from '@shared/api/friends.ts';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useLoaderHold } from '@/components/Loader';
import { Rise, usePressScale } from '@/components/motion';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { useFriends } from '@/features/friends/queries';
import { openDm } from '@/features/friends/openDm';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING, TOUCH } from '@/theme/tokens';

// Arkadaşlar, under Profil (docs/SPEC_V3.md §18.3; v45: .frs): the count beside the title, the
// friends in one card. A row opens the friend's profile, its "Mesaj" the DM. Removing and blocking
// stay where they were (the DM menu, the profile). No venue, position or active table of a friend
// anywhere.
export default function FriendsScreen() {
  const friends = useFriends();
  const loading = useLoaderHold(friends.isPending);

  return (
    <Screen>
      <ScreenHeader
        title={tr.profile.friends}
        titleDetail={friends.data ? String(friends.data.length) : undefined}
        onBack={() => router.back()}
      />

      {friends.isPending || loading ? (
        <View className="mt-12">
          <EmptyState kind="loading" body={tr.common.loading} />
        </View>
      ) : friends.isError ? (
        <Text tone="danger" className="mt-8">
          {errorMessage(friends.error)}
        </Text>
      ) : friends.data.length === 0 ? (
        <EmptyState kind="empty" body={tr.friends.empty} />
      ) : (
        <View className="mt-1">
          <Card flush>
            <View style={{ paddingVertical: SPACING[1.5] }}>
              {friends.data.map((f, i) => (
                <Rise key={f.publicId} index={i}>
                  <FriendRow friend={f} />
                </Rise>
              ))}
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}

// A friend (v45: .frow): the photo, the name and since when, and "Mesaj" when there is a
// conversation.
function FriendRow({ friend: f }: { friend: Friend }) {
  const { colors } = useTheme();
  const name = f.displayName ?? tr.profile.noName;
  const threadId = f.threadId;
  return (
    <View className="flex-row items-center" style={{ paddingRight: SPACING[4] }}>
      <Pressable
        className="flex-1"
        testID={`friend-${name}`}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${tr.friends.since(f.since)}`}
        onPress={() =>
          router.push({ pathname: '/people/[publicId]', params: { publicId: f.publicId } })
        }
      >
        {({ pressed }) => (
          <View
            className="flex-row items-center"
            style={{
              gap: SPACING[3] + SPACING[0.5],
              minHeight: TOUCH.large + SPACING[2],
              paddingVertical: SPACING[2.5],
              paddingLeft: SPACING[4],
              paddingRight: SPACING[2],
              backgroundColor: pressed ? colors.canvas : undefined,
            }}
          >
            <Avatar kind="profile" size="xl" name={name} photoUrl={f.photoUrl} />
            <View className="flex-1" style={{ gap: SPACING[0.5] }}>
              <Text variant="bodyStrong">{name}</Text>
              <Text variant="fine">{tr.friends.since(f.since)}</Text>
            </View>
          </View>
        )}
      </Pressable>
      {threadId ? (
        <MessagePill
          name={name}
          onPress={() => openDm({ threadId, publicId: f.publicId, name: f.displayName })}
        />
      ) : null}
    </View>
  );
}

// "Mesaj" (v45: .fmsg): a small capsule on the quiet fill, the touch area grown to 44.
function MessagePill({ name, onPress }: { name: string; onPress: () => void }) {
  const { colors, shape } = useTheme();
  const pressScale = usePressScale();
  const height = SPACING[9];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr.friends.message(name)}
      hitSlop={(TOUCH.min - height) / 2}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          className="flex-row items-center"
          style={[
            {
              gap: SPACING[1],
              height,
              paddingLeft: SPACING[2.5],
              paddingRight: SPACING[3] + SPACING[0.5],
              borderRadius: shape.radius.pill,
              backgroundColor: colors.surface2,
            },
            pressScale(pressed),
          ]}
        >
          <Icon name="chatbubble-outline" size={ICON.sm} tone="accent" />
          <Text variant="label" tone="accent">
            {tr.friends.messageShort}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
