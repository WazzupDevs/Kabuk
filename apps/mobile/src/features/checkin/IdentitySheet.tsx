import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';
import { View } from 'react-native';

import { Av } from '@/aura/kit';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { LookAvatar } from '@/components/LookAvatar';
import { PhotoSheet } from '@/features/profile/PhotoSheet';
import { useOwnLook } from '@/features/profile/useOwnLook';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { tr } from '@/i18n/tr';
import { callSetIdentity } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';
import { KIT } from '@/theme/auraKit';
import { AppIcon } from '@/components/AppIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON, SPACING } from '@/theme/tokens';
import { closeOverlay, confirm } from '@/lib/overlayStore';

// The one change of identity a check-in allows (docs/SPEC_V4.md §4.D; panolar MekanAnonimGec,
// MekanProfilGec: a centred dialog, Ortak kurallar C1): the two faces over the title, what changes,
// the one-change strip (anonymous), then the change and "Vazgeç". Outside, back and "Vazgeç" close it
// (`onClose`); a failed change stays open with the error in the top notice. A man or an unstated gender goes anonymous in
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
      : tr.identity.profileBody + (atTable ? tr.identity.onceTable : '');
  const confirmLabel = toAnonymous
    ? female
      ? tr.identity.anonConfirm
      : tr.identity.chatAnonConfirm
    : tr.identity.profileConfirm;
  // MekanAnonimGec `.sw`: the two faces 56, 10 apart, the arrow between.
  const face = <Av size="seat" name={photo.name} photoUrl={photo.url} />;
  const capsule = look ? (
    <LookAvatar look={look} size={KIT.size.av.seat} />
  ) : (
    <Avatar kind="default" size="md" />
  );
  const faces = (
    <View className="flex-row items-center" style={{ gap: SPACING[2.5] }}>
      {toAnonymous ? face : capsule}
      <AppIcon name="forward" size={ICON.md} color={colors.muted} />
      {toAnonymous ? capsule : face}
    </View>
  );
  // It opens with what the screen knew then (the dialog's content is one call, lib/overlayStore).
  const open = useEffectEvent(() => {
    change.reset();
    return confirm({
      title,
      note: body,
      face: faces,
      tone: 'plain',
      confirmLabel: needsPhoto ? tr.identity.addPhoto : confirmLabel,
      confirmIcon: needsPhoto ? 'photo' : toAnonymous ? 'eyeOff' : 'user',
      cancelLabel: tr.common.cancel,
      testID: needsPhoto ? undefined : 'identity-confirm',
      children: toAnonymous ? (
        <Banner tone="warn" title={tr.identity.onceTitle} body={tr.identity.onceBody} />
      ) : undefined,
      onCancel: onClose,
      onConfirm: async () => {
        if (needsPhoto) {
          // One sheet at a time: the dialog goes, the photo's comes (audit VEN-20).
          onClose();
          setPhotoSheet(true);
          return;
        }
        await change.mutateAsync();
      },
    });
  });
  useEffect(() => {
    if (!visible) return undefined;
    const id = open();
    return () => closeOverlay(id, false);
  }, [visible]);
  return <PhotoSheet visible={photoSheet} onClose={() => setPhotoSheet(false)} />;
}
