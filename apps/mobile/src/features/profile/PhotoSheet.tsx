import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { track } from '@/lib/analytics';
import { profileApi } from '@/lib/api';
import { FEEL_ERROR } from '@/lib/hapticMoments';

import { choosePhoto, PhotoError, type PhotoSource } from './photo';
import { profileViewKeys } from './queries';

function photoErrorMessage(err: unknown): string {
  if (err instanceof PhotoError) {
    return err.reason === 'permission' ? tr.profile.photoPermission : tr.profile.photoInvalid;
  }
  return errorMessage(err);
}

type Props = {
  visible: boolean;
  onClose: () => void;
  // "Fotoğrafı kaldır" too (Profili düzenle, with a photo).
  canRemove?: boolean;
};

// The profile photo sheet (canvas: Aşama 5 · Profili düzenle): from the library or the camera, or
// removed. Also opened in place where "Profilimle" needs a photo (canvas: Faz 2 · 22.1), so the
// screen and what was typed stay; it closes once the photo is up.
export function PhotoSheet({ visible, onClose, canRemove = false }: Props) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: profileViewKeys.all });
  const setPhoto = useMutation({
    meta: FEEL_ERROR,
    mutationFn: (source: PhotoSource) => choosePhoto(source),
    onSuccess: (changed) => {
      if (changed) track('profile_photo_set', {});
      onClose();
    },
    onSettled: refresh,
  });
  const removePhoto = useMutation({
    meta: FEEL_ERROR,
    mutationFn: () => profileApi.photoRemove(),
    onSuccess: () => onClose(),
    onSettled: refresh,
  });

  return (
    <Sheet visible={visible} onClose={onClose} title={tr.profile.photo} icon="image-outline">
      <Text variant="fine">{tr.profile.photoPrivacy}</Text>
      <Button
        variant="neutral"
        testID="photo-from-library"
        label={tr.profile.photoFromLibrary}
        onPress={() => setPhoto.mutate('library')}
        loading={setPhoto.isPending && setPhoto.variables === 'library'}
        disabled={setPhoto.isPending || removePhoto.isPending}
      />
      <Button
        variant="neutral"
        label={tr.profile.photoFromCamera}
        onPress={() => setPhoto.mutate('camera')}
        loading={setPhoto.isPending && setPhoto.variables === 'camera'}
        disabled={setPhoto.isPending || removePhoto.isPending}
      />
      {canRemove ? (
        <Button
          variant="danger"
          label={tr.profile.photoRemove}
          onPress={() => removePhoto.mutate()}
          loading={removePhoto.isPending}
          disabled={setPhoto.isPending}
        />
      ) : null}
      {setPhoto.isError ? (
        <View className="gap-2">
          <Text variant="fine" tone="danger">
            {photoErrorMessage(setPhoto.error)}
          </Text>
          {setPhoto.error instanceof PhotoError && setPhoto.error.reason === 'permission' ? (
            <Button
              variant="neutral"
              label={tr.checkin.openSettings}
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
        </View>
      ) : null}
      {removePhoto.isError ? (
        <Text variant="fine" tone="danger">
          {errorMessage(removePhoto.error)}
        </Text>
      ) : null}
      <Button variant="ghost" testID="photo-cancel" label={tr.common.cancel} onPress={onClose} />
    </Sheet>
  );
}
