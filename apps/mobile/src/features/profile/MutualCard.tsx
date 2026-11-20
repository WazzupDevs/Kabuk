import { View } from 'react-native';

import { CapIcon } from '@/aura/CapIcon';
import { Glass, T, useKit } from '@/aura/kit';
import { ProfileFace } from '@/features/profile/ProfileFace';
import { tr } from '@/i18n/tr';
import { Tap } from '@/motion';
import { AURA } from '@/theme/aura';
import { PERSON, PERSON_TYPE } from '@/theme/person';
import { useTheme } from '@/theme/ThemeProvider';

const M = PERSON.mutual;

type Mutual = {
  count: number;
  friends: readonly { displayName: string | null; photoUrl: string | null; publicId: string }[];
};

// A friend's profile, "Ortak arkadaşlar" (ProfilBaskasi `.mut`): one glass card, 22 round, the
// first two friends' faces stacked, "2 ortak arkadaş" over their names in the quiet colour, an
// arrow; the whole card opens the list (OrtakArkadaslar). Only on a friend's profile (rule 4).
export function MutualCard({ mutual, onPress }: { mutual: Mutual; onPress: () => void }) {
  const { scheme } = useTheme();
  const { c } = useKit();
  const shown = mutual.friends.slice(0, M.facesMax);
  const names = shown.map((f) => f.displayName ?? tr.profile.noName);
  return (
    <View style={{ alignSelf: 'stretch', marginTop: M.top }}>
      <Tap
        testID="profile-mutual"
        accessibilityRole="button"
        accessibilityLabel={`${tr.profile.mutualCount(mutual.count)}, ${tr.profile.mutualNames(names, mutual.count - shown.length)}`}
        onPress={onPress}
        style={{ width: '100%' }}
      >
        <Glass
          face={PERSON[scheme].card}
          radius={M.radius}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: M.gap,
            paddingVertical: M.padY,
            paddingHorizontal: M.padX,
          }}
        >
          <View style={{ flexDirection: 'row' }} importantForAccessibility="no-hide-descendants">
            {shown.map((f, i) => (
              <View
                key={f.publicId}
                style={{
                  width: M.face,
                  height: M.face,
                  borderRadius: M.face / 2,
                  borderWidth: M.ring,
                  borderColor: AURA[scheme].ground,
                  marginLeft: i === 0 ? 0 : -M.overlap,
                  overflow: 'hidden',
                }}
              >
                <ProfileFace
                  side={M.face - 2 * M.ring}
                  name={f.displayName ?? tr.profile.noName}
                  photoUrl={f.photoUrl}
                />
              </View>
            ))}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="body" ink style={PERSON_TYPE.mutual}>
              {tr.profile.mutualCount(mutual.count)}
            </T>
            <T v="body" color={c.muted} style={PERSON_TYPE.mutual}>
              {tr.profile.mutualNames(names, mutual.count - shown.length)}
            </T>
          </View>
          <CapIcon name="chevron" color={c.muted} soft={1} size={M.chevron} />
        </Glass>
      </Tap>
    </View>
  );
}
