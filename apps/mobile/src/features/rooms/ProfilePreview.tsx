import { Ionicons } from '@expo/vector-icons';
import type { ErrorCode } from '@shared/errors.ts';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tag } from '@/components/Tag';
import { Text } from '@/components/Text';
import { NoPhotoPicture } from '@/features/profile/PhotoNeeded';
import { useOwnPhoto } from '@/features/profile/useOwnPhoto';
import { tr } from '@/i18n/tr';
import { useTheme } from '@/theme/ThemeProvider';
import { ICON } from '@/theme/tokens';

// "Masanı lobiye aç", "Katıl" and "Bu masadayım".
export type GameFlowSheet = 'lobby' | 'join' | 'member';

type Props = {
  sheet: GameFlowSheet;
  // gameFlowView (@shared/gender.ts): the profile that goes, or first the one-time gender question.
  view: 'profile' | 'gender';
  // The server's last answer to this sheet, if it refused: anonymous_not_allowed sits on top,
  // photo_required in the photo box.
  refused: ErrorCode | null;
  onAddPhoto: () => void;
  onChooseGender: () => void;
};

const TITLE = {
  lobby: tr.participation.previewTitle,
  join: tr.participation.previewJoinTitle,
  member: tr.participation.previewTitle,
} as const;
const HINT = {
  lobby: tr.participation.previewLobby,
  join: tr.participation.previewJoin,
  member: tr.participation.previewMember,
} as const;
const NO_PHOTO = {
  lobby: tr.participation.photoNeededLobby,
  join: tr.participation.photoNeededJoin,
  member: tr.participation.photoNeededMember,
} as const;

// A man and "Belirtmek istemiyorum" always join with the profile (docs/SPEC_V3.md §23.D; canvas:
// Faz 3 · 23.2 → profil önizlemesi): no choice, the profile that goes (name, age, photo). Without a
// photo the box says why nothing can be sent and "Fotoğraf ekle" opens the photo sheet in place;
// an account from before the gender step answers it first ("Cinsiyetini seç").
export function ProfilePreview({ sheet, view, refused, onAddPhoto, onChooseGender }: Props) {
  const photo = useOwnPhoto();
  const photoRefused = refused === 'photo_required';
  const needsPhoto = (photo.known && !photo.has) || photoRefused;

  return (
    <View className="gap-3">
      {refused === 'anonymous_not_allowed' ? (
        <ErrorLine text={tr.errors.anonymous_not_allowed} />
      ) : null}
      <View className="gap-2">
        <Text variant="overline" tone="muted">
          {TITLE[sheet]}
        </Text>
        {needsPhoto ? (
          <NoPhotoBox
            text={photoRefused ? tr.errors.photo_required : NO_PHOTO[sheet]}
            refused={photoRefused}
            onAddPhoto={onAddPhoto}
          />
        ) : (
          <Card tone="note" testID="profile-preview">
            <View className="flex-row items-center gap-3">
              <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="xl" />
              <View className="flex-1 items-start gap-1">
                <Text variant="heading">{tr.participation.previewName(photo.name, photo.age)}</Text>
                <Tag variant="calm" label={tr.participation.previewTag} />
              </View>
            </View>
            <Text variant="fine" tone="text" className="mt-2.5">
              {HINT[sheet]}
            </Text>
          </Card>
        )}
      </View>
      {view === 'gender' ? (
        <>
          <ErrorLine text={tr.errors.gender_required} />
          <Button
            variant="neutral"
            testID="choose-gender"
            label={tr.signup.chooseGender}
            onPress={onChooseGender}
          />
        </>
      ) : null}
    </View>
  );
}

function ErrorLine({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-start gap-2"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle-outline" size={ICON.md} color={colors.danger} />
      <Text variant="bodyStrong" tone="danger" className="flex-1">
        {text}
      </Text>
    </View>
  );
}

// No photo yet, or the server's photo_required: a dashed box with the reason and the way out.
function NoPhotoBox({
  text,
  refused,
  onAddPhoto,
}: {
  text: string;
  refused: boolean;
  onAddPhoto: () => void;
}) {
  const { colors, shape } = useTheme();
  return (
    <View
      testID="profile-preview-no-photo"
      className="gap-3 p-4"
      style={{
        borderRadius: shape.radius.lg,
        borderWidth: Math.max(shape.stroke.control, 1),
        borderStyle: 'dashed',
        borderColor: colors.muted,
      }}
    >
      <View className="flex-row items-center gap-3">
        <NoPhotoPicture size="xl" />
        <Text
          variant="bodyStrong"
          tone={refused ? 'danger' : 'text'}
          className="flex-1"
          accessibilityLiveRegion="polite"
        >
          {text}
        </Text>
      </View>
      <View className="items-start">
        <Button
          variant="neutral"
          size="sm"
          icon="camera-outline"
          testID="photo-add"
          label={tr.profile.photoAdd}
          onPress={onAddPhoto}
        />
      </View>
    </View>
  );
}
