-- Temizlik B (docs/temizlik-listesi.md → "B'nin sonucu", 4): nearby_venues and venue_distance_m
-- have no caller. Check-in measures with venue_contains (checkin/index.ts); Keşfet lists venues
-- with explore_venues, picked by hand (rule 6). No function, policy, view or dependency reads
-- them. The owner's call, 3 Kasım.
drop function public.nearby_venues(double precision, double precision);
drop function public.venue_distance_m(uuid, double precision, double precision);
