import { PARTICIPATIONS, type Participation } from '@shared/profile.ts';
import { type Intent, INTENTS, isIntent } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ChoiceCard } from '@/components/ChoiceCard';
import { Pills } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/Text';
import { useProfile } from '@/features/account/useProfile';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { NoPhotoPicture, PhotoNeeded } from '@/features/profile/PhotoNeeded';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { registerForPush } from '@/features/push/push';
import { participationHint } from '@/features/rooms/participation';
import { roomKeys } from '@/features/rooms/queries';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';

type IntentChoice = Intent | 'none';

// "Oda kur" (docs/SPEC_V3.md §5.1): always open to the venue, no game chosen; an optional intent
// label and, for this room, anonymous or with the profile (§5.4; anonymous by default). From
// Aktiviteler ("Bu oyunla oda kur", §18.3) the intent arrives preselected. "Profilimle" needs a
// profile photo (§22.G): without one it cannot be chosen, and "Fotoğraf ekle" opens the photo
// sheet right here, so the choices made stay.
export default function NewRoomScreen() {
  const params = useLocalSearchParams<{ intent?: string }>();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const hasName = !!profile.data?.display_name;
  const table = useActiveTable();
  const [intent, setIntent] = useState<Intent | null>(() =>
    isIntent(params.intent) ? params.intent : null,
  );
  const [participation, setParticipation] = useState<Participation>('anonymous');
  const photo = useOwnPhoto();
  const [photoSheet, setPhotoSheet] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      roomsApi.create({
        profiled: participation === 'profile',
        ...(intent ? { intent } : {}),
      }),
    onSuccess: async ({ roomId }) => {
      track('room_created', { intent: intent ?? 'none', profiled: participation === 'profile' });
      track('participation_chosen', { mode: participation });
      void registerForPush();
      await queryClient.invalidateQueries({ queryKey: roomKeys.current });
      router.replace({ pathname: '/room/[id]', params: { id: roomId } });
    },
    onError: (err) => {
      // The photo went (or was hidden) after the screen read it: no room; back to anonymous.
      if (err instanceof ApiError && err.code === 'photo_required') {
        setParticipation('anonymous');
        void photo.refresh();
      }
    },
  });
  const refused = create.error instanceof ApiError && create.error.code === 'photo_required';
  const needsPhoto = hasName && ((photo.known && !photo.has) || refused);

  return (
    <Screen>
      <ScreenHeader
        title={tr.rooms.newTitle}
        subtitle={tr.rooms.newHint}
        onBack={() => router.back()}
      />
      <Text variant="overline" tone="muted" className="mt-5">
        {tr.rooms.intentLabel}
      </Text>
      <View className="mt-2.5 gap-2">
        <Pills<IntentChoice>
          value={intent ?? 'none'}
          onChange={(v) => setIntent(v === 'none' ? null : v)}
          options={[
            { value: 'none', label: tr.rooms.intentNone, testID: 'intent-none' },
            ...INTENTS.map((i) => ({ value: i, label: tr.intents[i], testID: `intent-${i}` })),
          ]}
        />
        {intent ? (
          <Text variant="fine" className="px-1">
            {tr.rooms.intentHint[intent]}
          </Text>
        ) : null}
      </View>
      <Text variant="overline" tone="muted" className="mt-6">
        {tr.participation.title}
      </Text>
      <View accessibilityRole="radiogroup" className="mt-2.5 flex-row gap-3">
        {PARTICIPATIONS.map((mode) => (
          <ChoiceCard
            key={mode}
            testID={`participation-${mode}`}
            label={tr.participation[mode]}
            picture={
              mode === 'anonymous' ? (
                <Avatar kind="table" alias={table.data?.alias ?? ''} size="xl" />
              ) : needsPhoto ? (
                <NoPhotoPicture />
              ) : (
                <Avatar
                  kind="profile"
                  name={profile.data?.display_name ?? tr.participation.profile}
                  photoUrl={photo.url}
                  size="xl"
                />
              )
            }
            selected={participation === mode}
            disabled={mode === 'profile' && !hasName}
            unavailable={mode === 'profile' && needsPhoto}
            onPress={() => setParticipation(mode)}
          />
        ))}
      </View>
      {/* The chosen mode's explanation under the cards, so the two cards stay short. */}
      <Text variant="fine" className="mt-2 px-1">
        {participationHint(participation, hasName)}
      </Text>
      {!hasName ? (
        <Text variant="fine" className="mt-1 px-1">
          {participationHint('profile', false)}
        </Text>
      ) : null}
      {needsPhoto ? (
        <View className="mt-2 px-1">
          <PhotoNeeded refused={refused} onAddPhoto={() => setPhotoSheet(true)} />
        </View>
      ) : null}
      {create.isError && !refused ? (
        <Text variant="fine" tone="danger" className="mt-4">
          {errorMessage(create.error)}
        </Text>
      ) : null}
      <View className="mt-auto pt-8">
        <Button
          size="lg"
          label={tr.rooms.createConfirm}
          onPress={() => create.mutate()}
          loading={create.isPending}
        />
      </View>
      <PhotoSheet
        visible={photoSheet}
        onClose={() => {
          setPhotoSheet(false);
          create.reset();
        }}
      />
    </Screen>
  );
}
