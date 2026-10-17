import { gameFlowView } from '@shared/gender.ts';
import { PARTICIPATIONS, type Participation } from '@shared/profile.ts';
import { CONCEPTS, type Concept, type Intent, INTENTS } from '@shared/rooms.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ChoiceCard } from '@/components/ChoiceCard';
import { Pills } from '@/components/Pills';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { GenderSheet } from '@/features/account/GenderSheet';
import { useProfile } from '@/features/account/useProfile';
import { NoPhotoPicture, PhotoNeeded } from '@/features/profile/PhotoNeeded';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { registerForPush } from '@/features/push/push';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { ApiError, roomsApi } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { participationHint } from './participation';
import { ProfilePreview } from './ProfilePreview';
import { roomKeys } from './queries';

type IntentChoice = Intent | 'none';
type TagChoice = Concept | 'none';

type Props = {
  onClose: () => void;
  // The table is in the lobby: the venue shows its card's new state.
  onOpened: () => void;
  alias: string;
  venueId: string;
  // From Aktiviteler ("Bu oyunla lobiye aç", docs/SPEC_V3.md §18.3): that game's intent and tag.
  intent?: Intent | null;
  gameTag?: Concept | null;
};

// "Masanı lobiye aç" (docs/SPEC_V3.md §23.C; canvas: Faz 3 · 23.1 Masa ve lobi): the table opens to
// the venue's lobby as today's open room, no game chosen; an optional intent, an optional game tag
// that only the lobby shows ("Fark etmez": none) and, for this table, anonymous or with the profile
// (§5.4; anonymous by default). A man and "Belirtmek istemiyorum" see no choice but the profile
// that goes (§23.D; canvas: Faz 3 · 23.2). "Profilimle" needs a profile photo (§22.G): "Fotoğraf
// ekle" swaps this sheet for the photo sheet and the choices made stay; "Cinsiyetini seç" does the
// same with the one-time gender question. The sheet closes on the venue screen, whose table card
// then says "Lobide açık"; nothing opens the room by itself.
export function OpenLobbySheet({
  onClose,
  onOpened,
  alias,
  venueId,
  intent: initialIntent,
  gameTag,
}: Props) {
  const queryClient = useQueryClient();
  const profile = useProfile();
  const hasName = !!profile.data?.display_name;
  const [intent, setIntent] = useState<Intent | null>(initialIntent ?? null);
  const [tag, setTag] = useState<Concept | null>(gameTag ?? null);
  const [participation, setParticipation] = useState<Participation>('anonymous');
  const photo = useOwnPhoto();
  const [photoSheet, setPhotoSheet] = useState(false);
  const [genderSheet, setGenderSheet] = useState(false);
  // The server said this account joins only with its profile (the phone did not know its gender).
  const [mustProfile, setMustProfile] = useState(false);

  const create = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (profiled: boolean) =>
      roomsApi.create({
        profiled,
        ...(intent ? { intent } : {}),
        ...(tag ? { gameTag: tag } : {}),
      }),
    onSuccess: async () => {
      haptic('tableOpened');
      // Never the anonymous or profiled choice: it would stand in for the gender (§23.L).
      track('room_created', { intent: intent ?? 'none', game_tag: tag ?? 'none' });
      void registerForPush();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomKeys.current }),
        queryClient.invalidateQueries({ queryKey: roomKeys.lobby(venueId) }),
      ]);
      onOpened();
      onClose();
    },
    onError: (err) => {
      // The photo went (or was hidden) after the sheet read it: not in the lobby; back to anonymous.
      if (err instanceof ApiError && err.code === 'photo_required') {
        setParticipation('anonymous');
        void photo.refresh();
      }
      // Shown as the profile that goes; nothing is sent until the next press.
      if (err instanceof ApiError && err.code === 'anonymous_not_allowed') {
        setMustProfile(true);
        void photo.refresh();
      }
    },
  });
  const code = create.error instanceof ApiError ? create.error.code : null;
  const refused = code === 'photo_required';
  const needsPhoto = hasName && ((photo.known && !photo.has) || refused);
  const view = gameFlowView(
    photo.gender,
    code === 'gender_required'
      ? 'gender_required'
      : mustProfile || code === 'anonymous_not_allowed'
        ? 'anonymous_not_allowed'
        : null,
  );
  const profiled = view !== 'choice' || participation === 'profile';
  const handled = refused || code === 'anonymous_not_allowed' || code === 'gender_required';

  return (
    <>
      <Sheet visible={!photoSheet && !genderSheet} onClose={onClose} title={tr.rooms.newTitle}>
        <Text variant="fine" tone="text">
          {tr.rooms.newHint}
        </Text>
        <View className="gap-2">
          <Text variant="overline" tone="muted">
            {tr.rooms.intentLabel}
          </Text>
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
        <View className="gap-2">
          <Text variant="overline" tone="muted">
            {tr.rooms.gameTagLabel}
          </Text>
          <Pills<TagChoice>
            wrap
            value={tag ?? 'none'}
            onChange={(v) => setTag(v === 'none' ? null : v)}
            options={[
              { value: 'none', label: tr.rooms.gameTagNone, testID: 'game-tag-none' },
              ...CONCEPTS.map((c) => ({
                value: c,
                label: tr.concepts[c],
                testID: `game-tag-${c}`,
              })),
            ]}
          />
          <Text variant="fine" className="px-1">
            {tr.rooms.gameTagHint}
          </Text>
        </View>
        {view !== 'choice' ? (
          <ProfilePreview
            sheet="lobby"
            view={view}
            refused={code}
            onAddPhoto={() => setPhotoSheet(true)}
            onChooseGender={() => setGenderSheet(true)}
          />
        ) : (
          <View className="gap-2">
            <Text variant="overline" tone="muted">
              {tr.participation.title}
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row gap-3">
              {PARTICIPATIONS.map((mode) => (
                <ChoiceCard
                  key={mode}
                  testID={`participation-${mode}`}
                  label={tr.participation[mode]}
                  picture={
                    mode === 'anonymous' ? (
                      <Avatar kind="table" alias={alias} size="lg" />
                    ) : needsPhoto ? (
                      <NoPhotoPicture size="lg" />
                    ) : (
                      <Avatar
                        kind="profile"
                        name={profile.data?.display_name ?? tr.participation.profile}
                        photoUrl={photo.url}
                        size="lg"
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
            <Text variant="fine" className="px-1">
              {participationHint(participation, hasName)}
            </Text>
            {!hasName ? (
              <Text variant="fine" className="px-1">
                {participationHint('profile', false)}
              </Text>
            ) : null}
            {needsPhoto ? (
              <View className="px-1">
                <PhotoNeeded refused={refused} onAddPhoto={() => setPhotoSheet(true)} />
              </View>
            ) : null}
          </View>
        )}
        {create.isError && !handled ? (
          <Text variant="fine" tone="danger">
            {errorMessage(create.error)}
          </Text>
        ) : null}
        <Button
          size="lg"
          testID="lobby-confirm"
          label={tr.rooms.createConfirm}
          onPress={() => create.mutate(profiled)}
          disabled={view === 'gender' || (view === 'profile' && needsPhoto)}
          loading={create.isPending}
        />
      </Sheet>
      <PhotoSheet
        visible={photoSheet}
        onClose={() => {
          setPhotoSheet(false);
          create.reset();
        }}
      />
      <GenderSheet
        visible={genderSheet}
        onClose={() => {
          setGenderSheet(false);
          create.reset();
        }}
      />
    </>
  );
}
