import { useQuery } from '@tanstack/react-query';

import { profileApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export const profileViewKeys = {
  all: ['profileView'] as const,
  view: (publicId: string) => ['profileView', publicId] as const,
  roomMembers: (roomId: string) => ['roomMemberProfiles', roomId] as const,
};

// A profile as profile/get returns it: the caller's own, a friend's, or the other table's in the
// current room. Not kept after the screen closes (access can end with the room), and refetched
// well before the one-hour photo URL expires.
export function useProfileView(publicId: string | null | undefined) {
  return useQuery({
    queryKey: profileViewKeys.view(publicId ?? ''),
    enabled: !!publicId,
    staleTime: 10 * 60_000,
    gcTime: 0,
    retry: false,
    queryFn: () => profileApi.get(publicId ?? ''),
  });
}

// The profile ids of the other profiled phones in the room, both sides, by table session id, while
// the room runs (docs/SPEC_V3.md §22.G; rule 4). `people`: the room's phones, so the list is read
// again when a phone joins or leaves.
export function useRoomMemberProfiles(roomId: string, people: string) {
  return useQuery({
    queryKey: [...profileViewKeys.roomMembers(roomId), people],
    queryFn: async (): Promise<ReadonlyMap<string, string>> => {
      const { data, error } = await supabase.rpc('room_member_profiles', {
        target_room_id: roomId,
      });
      if (error) throw error;
      return new Map(data.map((p) => [p.session_id, p.public_id]));
    },
  });
}
