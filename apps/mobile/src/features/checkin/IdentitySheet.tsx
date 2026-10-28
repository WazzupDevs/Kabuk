import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { LookAvatar } from '@/components/LookAvatar';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { callSetIdentity } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { AppIcon } from '@/components/AppIcon';

// The one change of identity a check-in allows (docs/SPEC_V4.md §4.D; skall tuvali MekanAnonimGecis,
// MekanAnonimGecisErkek, MekanProfilGecis, MekanProfilGecisFotosuz): the two faces, what changes,
// the one-change strip, then the change and "Vazgeç". A man or an unstated gender goes anonymous in
// the venue chat only (rule 12: the gender only picks the words here, on the person's own phone).
export function IdentitySheet({
  visible,
  onClose,
  toAnonymous,
  atTable,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  // The change asked: to anonymous (true) or to the profile (false).
  toAnonymous: boolean;
  // A table now: its identity stays until it ends.
  atTable: boolean;
  // After the change: the screen reads what shows the identity again (the venue chat's page).
  onChanged?: () => void;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const photo = useOwnPhoto();
  const look = useOwnLook();
  const [photoSheet, setPhotoSheet] = useState(false);
  const change = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => callSetIdentity(toAnonymous),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activeTable'] });
      onChanged?.();
      onClose();
    },
  });
  const female = photo.gender === 'female';
  const needsPhoto = !toAnonymous && photo.known && !photo.has;
  const title = toAnonymous
    ? female
      ? tr.identity.anonTitle
      : tr.identity.chatAnonTitle
    : tr.identity.profileTitle;
  const body = toAnonymous
    ? (female ? tr.identity.anonBody : tr.identity.chatAnonBody)(photo.nick)
    : needsPhoto
      ? tr.identity.photoNeeded
      : tr.identity.profileBody;
  const confirm = toAnonymous
    ? female
      ? tr.identity.anonConfirm
      : tr.identity.chatAnonConfirm
    : tr.identity.profileConfirm;
  const face = <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="lg" />;
  const capsule = look ? (
    <LookAvatar look={look} size={SPACING[12]} />
  ) : (
    <Avatar kind="default" size="lg" />
  );
  // Closed, it opens next time without the last error.
  const close = () => {
    change.reset();
    onClose();
  };
  return (
    <>
      <Sheet visible={visible} onClose={close} title={title}>
        <View className="flex-row items-center self-start" style={{ gap: SPACING[2] }}>
          {toAnonymous ? face : capsule}
          <AppIcon name="arrow-forward" size={ICON.md} color={colors.muted} />
          {toAnonymous ? capsule : face}
        </View>
        <Text variant="fine">{body}</Text>
        {needsPhoto ? null : (
          <Banner
            tone="warn"
            title={tr.identity.onceTitle}
            body={tr.identity.onceBody + (!toAnonymous && atTable ? tr.identity.onceTable : '')}
          />
        )}
        {change.isError ? <Banner tone="danger" body={errorMessage(change.error)} /> : null}
        <View className="gap-2.5">
          {needsPhoto ? (
            <Button
              size="lg"
              icon="camera-outline"
              label={tr.identity.addPhoto}
              onPress={() => {
                // One sheet at a time: this one goes, the photo's comes (audit VEN-20).
                close();
                setPhotoSheet(true);
              }}
            />
          ) : (
            <Button
              size="lg"
              testID="identity-confirm"
              label={confirm}
              loading={change.isPending}
              onPress={() => change.mutate()}
            />
          )}
          <Button size="lg" variant="neutral" label={tr.common.cancel} onPress={close} />
        </View>
      </Sheet>
      <PhotoSheet visible={photoSheet} onClose={() => setPhotoSheet(false)} />
    </>
  );
}
