import type {
  DistrictPeopleResponse,
  DistrictPerson,
  DistrictState,
} from '@shared/api/district.ts';
import {
  DISTRICT_CHAT_BROADCAST,
  DISTRICT_CHAT_REACTION_BROADCAST,
  districtChatChannel,
} from '@shared/district.ts';
import { type VenueChatMessage, withVenueChatExtras } from '@shared/venueChat.ts';
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useReactions } from '@/features/chat/messageExtras';
import { useBroadcast } from '@/features/rooms/useBroadcast';
import { districtApi, districtChatApi, profileApi } from '@/lib/api';
import { stablePhoto } from '@/lib/photoUrls';

import { syncContinueNotice } from './continueNotice';

export const districtKeys = {
  state: ['district', 'state'] as const,
  // Per room: a new room never starts from the last one's page.
  chat: (roomId: string) => ['district', 'chat', roomId] as const,
  profile: (messageId: string) => ['district', 'profile', messageId] as const,
  people: ['district', 'people'] as const,
  person: (ref: string) => ['district', 'person', ref] as const,
};

// The open district (Skall Semti) the session last seen was in, for "Yeniden gir" on the closed
// session's screen: the state no longer says it once the session is gone. Undefined: the person's
// own district.
let sessionOpenRef: string | undefined;
function noteSession(state: DistrictState): void {
  if (!state.session) return;
  const ref = state.session.district.ref;
  sessionOpenRef = state.openDistricts.some((d) => d.ref === ref) ? ref : undefined;
}
export function lastSessionOpenRef(): string | undefined {
  return sessionOpenRef;
}

// The person's own district, Geçit and session: never the right option, never a head count. Each
// read keeps the "Devam?" notice in step with the session.
export async function readDistrictState(): Promise<DistrictState> {
  const state = await districtApi.state();
  noteSession(state);
  void syncContinueNotice(state);
  return state;
}

export function useDistrictState(enabled = true) {
  return useQuery({
    queryKey: districtKeys.state,
    queryFn: readDistrictState,
    enabled,
  });
}

// Every district answer is the new state: the screens read it at once, and the "Devam?" notice
// follows the session.
export function putDistrictState(queryClient: QueryClient, state: DistrictState): void {
  queryClient.setQueryData(districtKeys.state, state);
  noteSession(state);
  void syncContinueNotice(state);
}

function readPage(messages: readonly VenueChatMessage[]): VenueChatMessage[] {
  return messages
    .map((m) => withVenueChatExtras({ ...m, photoUrl: stablePhoto(m.photoUrl) }))
    .reverse();
}

// The room's newest page, oldest first for the screen; read again on the data-free broadcasts of
// district_chat:{roomId} (rule 9) and on every (re)subscribe.
export function useDistrictChat(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const refetch = useCallback(() => {
    if (roomId) void queryClient.invalidateQueries({ queryKey: districtKeys.chat(roomId) });
  }, [queryClient, roomId]);
  const topic = roomId ? districtChatChannel(roomId) : null;
  useBroadcast(topic, DISTRICT_CHAT_BROADCAST, refetch);
  useBroadcast(topic, DISTRICT_CHAT_REACTION_BROADCAST, refetch);
  return useQuery({
    queryKey: districtKeys.chat(roomId ?? ''),
    enabled: roomId !== undefined,
    queryFn: async () => {
      const page = await districtChatApi.page();
      return { messages: readPage(page.messages), roomId: page.roomId };
    },
  });
}

// An older page, oldest first (useOlderPages).
export async function readDistrictChatOlder(before: string): Promise<VenueChatMessage[]> {
  const page = await districtChatApi.page(before);
  return readPage(page.messages);
}

export function useDistrictChatReactions(roomId: string | undefined) {
  const queryClient = useQueryClient();
  return useReactions(districtChatApi.react, () =>
    queryClient.invalidateQueries({ queryKey: districtKeys.chat(roomId ?? '') }),
  );
}

// The sender of a profiled message, opened through the message (no public_id).
export function useDistrictChatProfile(messageId: string | undefined) {
  return useQuery({
    queryKey: districtKeys.profile(messageId ?? ''),
    enabled: !!messageId,
    retry: false,
    queryFn: () => profileApi.getFromDistrictChat(messageId ?? ''),
  });
}

// A profiled row of Odadakiler, opened through its reference; never kept (the reference is the
// session's and goes with it).
export function useDistrictPersonProfile(ref: string | undefined) {
  return useQuery({
    queryKey: districtKeys.person(ref ?? ''),
    enabled: !!ref,
    retry: false,
    gcTime: 0,
    queryFn: () => profileApi.getFromDistrictPerson(ref ?? ''),
  });
}

// Odadakiler: the room's people, read again at every opening (the server publishes nothing for it:
// "gelen ve giden yayınlanmaz", docs/SPEC_V4.md §4.V) and never kept once the sheet is gone.
export function useDistrictPeople() {
  return useQuery({
    queryKey: districtKeys.people,
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<DistrictPeopleResponse> => {
      const r = await districtChatApi.people();
      const face = (p: DistrictPerson): DistrictPerson =>
        p.profiled ? { ...p, photoUrl: stablePhoto(p.photoUrl) } : p;
      return {
        count: r.count,
        me: r.me ? face(r.me) : null,
        profiled: r.profiled.map((p) => ({ ...p, photoUrl: stablePhoto(p.photoUrl) })),
        anonymous: r.anonymous,
      };
    },
  });
}
