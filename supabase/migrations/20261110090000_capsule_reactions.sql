-- docs/SPEC_V4.md §4.C (the project owner's decision of 26 October, "B"): the six capsule faces
-- replace the six emojis in the DM, the room chat and the venue chat. Each stored reaction becomes
-- the face its emoji maps to (supabase/functions/_shared/pure/reactions.ts → toReaction); the
-- Edge Functions take the old emojis the same way from an app that has not updated yet. One
-- reaction per person and message stays one: the keys do not change.
update public.dm_reactions
set emoji = case emoji
  when '👍' then 'begen'
  when '😂' then 'kahkaha'
  when '😮' then 'saskin'
  else 'ask'
end
where emoji in ('👍', '❤️', '😂', '😮', '🎉', '🔥');

update public.message_reactions
set emoji = case emoji
  when '👍' then 'begen'
  when '😂' then 'kahkaha'
  when '😮' then 'saskin'
  else 'ask'
end
where emoji in ('👍', '❤️', '😂', '😮', '🎉', '🔥');

update public.venue_chat_reactions
set emoji = case emoji
  when '👍' then 'begen'
  when '😂' then 'kahkaha'
  when '😮' then 'saskin'
  else 'ask'
end
where emoji in ('👍', '❤️', '😂', '😮', '🎉', '🔥');
