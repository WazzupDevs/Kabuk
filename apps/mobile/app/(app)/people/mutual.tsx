import { useLocalSearchParams } from 'expo-router';

import { MutualFriends } from '@/features/profile/MutualFriends';

// Ortak arkadaşlar (yeni arayüz tuvali OrtakArkadaslar), opened from a friend's profile:
// features/profile/MutualFriends.
export default function MutualFriendsScreen() {
  const { publicId, name } = useLocalSearchParams<{ publicId: string; name?: string }>();
  return <MutualFriends publicId={publicId} name={name} />;
}
