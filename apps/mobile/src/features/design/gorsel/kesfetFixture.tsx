import type { DistrictState } from '@shared/api/district.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { activeTableQueryKey } from '@/features/checkin/useActiveTable';
import { districtKeys } from '@/features/district/queries';
import type { ExploreVenue } from '@/features/explore/useExploreVenues';
import { goOffline } from '@/lib/offline';

import { ExploreView, type ExploreStart } from '../../../../app/(app)/(tabs)/explore';

// The Keşfet family for the visual gate (`ekran/kesfet…`): the route's own screen (ExploreView),
// drawn whole, over an own query client filled with the boards' sample (docs/design/yeni-arayuz/
// project: Kesfet, KesfetSemtIcerde, KesfetHarita, KesfetBos, KesfetAra, KesfetAraBos); no server,
// nothing signed in. The boards are a Saturday evening ("CUMARTESİ AKŞAMI"); the gate's clock
// stands on a Thursday noon, so the fixture moves it to the board's moment before it draws.
const SATURDAY_EVENING = Date.parse('2026-01-17T20:00:00+03:00');
const MINUTE = 60_000;

type Row = {
  name: string;
  district: string;
  city: string;
  kind: 'campus' | 'cafe';
  bucket: ExploreVenue['bucket'];
  lat: number;
  lng: number;
  // A search holds a campus's university's name too (filterVenues): the board's "kaf" finds the
  // tea garden under its second line, which no name of it holds.
  university?: string;
};

// KesfetKaydir's eight (its order is the list's own: the name's, İ before S); Kesfet draws the
// first two.
const IGU: Row = {
  name: 'İstanbul Gelişim Üniversitesi',
  district: 'Avcılar',
  city: 'İstanbul',
  kind: 'campus',
  bucket: 'calm',
  lat: 40.9985,
  lng: 28.7176,
};
const SAKARYA: Row = {
  name: 'Sakarya Üniversitesi',
  district: 'Serdivan',
  city: 'Sakarya',
  kind: 'campus',
  bucket: 'lively',
  lat: 40.7424,
  lng: 30.3321,
};
const BAHCE: Row = {
  name: 'Bahçe Kafe',
  district: 'Kadıköy',
  city: 'İstanbul',
  kind: 'cafe',
  bucket: 'lively',
  lat: 40.9903,
  lng: 29.0292,
};
const KITAP: Row = {
  name: 'Kitap Kafe',
  district: 'Beşiktaş',
  city: 'İstanbul',
  kind: 'cafe',
  bucket: 'calm',
  lat: 41.0422,
  lng: 29.0083,
};
const LIMAN: Row = {
  name: 'Liman Çay Bahçesi',
  district: 'Avcılar',
  city: 'İstanbul',
  kind: 'cafe',
  bucket: 'calm',
  lat: 40.9794,
  lng: 28.7208,
  university: 'Liman Kafe',
};
const EIGHT: readonly Row[] = [
  IGU,
  SAKARYA,
  BAHCE,
  {
    ...KITAP,
    name: 'Yıldız Teknik Üniversitesi',
    kind: 'campus',
    bucket: 'buzzing',
    district: 'Beşiktaş',
  },
  KITAP,
  {
    ...IGU,
    name: 'Marmara Üniversitesi',
    district: 'Göztepe',
    bucket: 'lively',
    lat: 40.9876,
    lng: 29.0526,
  },
  LIMAN,
  { ...IGU, name: 'İstanbul Üniversitesi', district: 'Beyazıt', lat: 41.0116, lng: 28.9639 },
];

function venue(n: number, r: Row): ExploreVenue {
  return {
    id: `v${n}`,
    name: r.name,
    district: r.district,
    kind: r.kind,
    category: r.kind === 'campus' ? null : 'kafe',
    lat: r.lat,
    lng: r.lng,
    bucket: r.bucket,
    events: [],
    event: null,
    boundary: null,
    university: r.university ? { id: `u${n}`, ref: `u${n}`, name: r.university } : null,
  };
}

const IN_DISTRICT: DistrictState = {
  district: { ref: 'beylikduzu', name: 'Beylikdüzü' },
  located: 'inside',
  gate: 'question',
  question: { day: '2026-01-17', slot: 1, prompt: '', options: [] },
  opensAt: '2026-01-18T00:00:00+03:00',
  retryAt: null,
  openDistricts: [{ ref: 'skall-semti', name: 'Skall Semti' }],
  session: null,
  pickByHand: false,
};

// KesfetSemtIcerde: in the room with 1 sa 24 dk left.
const IN_ROOM: DistrictState = {
  ...IN_DISTRICT,
  gate: 'passed',
  question: null,
  session: {
    id: 's1',
    district: { ref: 'beylikduzu', name: 'Beylikdüzü' },
    roomId: 'r1',
    phase: 'active',
    endsAt: new Date(SATURDAY_EVENING + 84 * MINUTE).toISOString(),
    graceEndsAt: new Date(SATURDAY_EVENING + 114 * MINUTE).toISOString(),
    joinedAt: new Date(SATURDAY_EVENING - 6 * MINUTE).toISOString(),
    identity: 'anonymous',
    identitySwitchUsed: false,
  },
};

export type KesfetVariant =
  'list' | 'room' | 'map' | 'empty' | 'search' | 'search-empty' | 'scrolled';

// Kesfet (10), KesfetSemtIcerde (10b), KesfetHarita (11), KesfetBos (112), KesfetAra (116),
// KesfetAraBos (117).
export function KesfetFixture({ variant = 'list' }: { variant?: KesfetVariant }) {
  const [client] = useState(() => {
    // Off the network (lib/offline.ts): nothing is joined or read.
    goOffline();
    Date.now = () => SATURDAY_EVENING;
    const rows: readonly Row[] =
      variant === 'empty'
        ? []
        : variant === 'search' || variant === 'scrolled'
          ? EIGHT
          : [IGU, SAKARYA];
    const venues = rows.map((r, i) => venue(i + 1, r));
    const c = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    c.setQueryData(['exploreVenues'], venues);
    c.setQueryData(
      ['venueCities'],
      Object.fromEntries(venues.map((v, i) => [v.id, rows[i]?.city ?? ''])),
    );
    c.setQueryData(districtKeys.state, variant === 'room' ? IN_ROOM : IN_DISTRICT);
    c.setQueryData(activeTableQueryKey(undefined), null);
    return c;
  });
  const start: ExploreStart | undefined =
    variant === 'map'
      ? { view: 'map', selected: 'v1' }
      : variant === 'search'
        ? { query: 'kaf' }
        : variant === 'search-empty'
          ? { query: 'sinema' }
          : undefined;
  return (
    <QueryClientProvider client={client}>
      <ExploreView start={start} />
    </QueryClientProvider>
  );
}
