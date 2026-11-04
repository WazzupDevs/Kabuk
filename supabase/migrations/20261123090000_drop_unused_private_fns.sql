-- Temizlik B (docs/temizlik-listesi.md → "B'nin sonucu", 5): four private functions left by older
-- versions that nothing calls (no function body, trigger, policy, view, default, constraint,
-- cron job or pg_depend entry; no Edge Function, script or test). The owner's call, 4 Kasım.
-- owns_session's policy went in an earlier migration; it was still executable by authenticated.
drop function private.end_friendship(uuid, uuid);
drop function private.end_two_sided_room(uuid);
drop function private.owns_session(uuid);
drop function private.pair_key(uuid, uuid);
