import type { Participation } from '@shared/profile.ts';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Choice } from '@/components/Choice';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { PhotoNeeded } from '@/features/profile/PhotoNeeded';
import { errorMessage } from '@/i18n/errors';
import { tr } from '@/i18n/tr';
import { ApiError } from '@/lib/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  // The table's alias, the anonymous face.
  alias: string;
  photo: { known: boolean; has: boolean; url: string | null; name: string };
  sending: boolean;
  // The send's error while the sheet is open.
  error: unknown;
  onSend: (profiled: boolean) => void;
  onAddPhoto: () => void;
};

// The one choice of a check-in in the venue chat (docs/SPEC_V3.md §22.G, decision 7; canvas:
// Faz 2 · 22.1), asked at the first "Gönder": anonymous by default (rule 4), or with the profile,
// which needs a photo (decision 8). The message goes with the choice; closing the sheet sends
// nothing and keeps what was typed.
export function ModeSheet({
  visible,
  onClose,
  alias,
  photo,
  sending,
  error,
  onSend,
  onAddPhoto,
}: Props) {
  const [picked, setPicked] = useState<Participation>('anonymous');
  const refused = error instanceof ApiError && error.code === 'photo_required';
  const needsPhoto = (photo.known && !photo.has) || refused;
  // Without a photo (or once the server refused it) only anonymous can be chosen.
  const choice = needsPhoto ? 'anonymous' : picked;
  // Closed without sending: the next opening starts anonymous again.
  const close = () => {
    setPicked('anonymous');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title={tr.venueChat.modeTitle}>
      <View accessibilityRole="radiogroup" className="gap-2">
        <Choice
          testID="venue-chat-mode-anonymous"
          label={tr.participation.anonymous}
          hint={tr.venueChat.modeAnonymousHint(alias)}
          picture={<Avatar kind="table" alias={alias} size="sm" />}
          selected={choice === 'anonymous'}
          onPress={() => setPicked('anonymous')}
        />
        <Choice
          testID="venue-chat-mode-profile"
          label={tr.participation.profile}
          hint={tr.venueChat.modeProfileHint}
          picture={
            needsPhoto ? null : (
              <Avatar kind="profile" name={photo.name} photoUrl={photo.url} size="sm" />
            )
          }
          selected={choice === 'profile'}
          onPress={() => setPicked('profile')}
          unavailable={
            needsPhoto ? <PhotoNeeded refused={refused} onAddPhoto={onAddPhoto} /> : undefined
          }
        />
      </View>
      {error && !refused ? (
        <Text variant="fine" tone="danger">
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button
        testID="venue-chat-mode-send"
        label={tr.venueChat.send}
        onPress={() => onSend(choice === 'profile')}
        loading={sending}
      />
    </Sheet>
  );
}
