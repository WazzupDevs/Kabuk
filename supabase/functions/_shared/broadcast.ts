// Data-free Realtime broadcasts (MVP_SPEC §9 Realtime): clients refetch through RLS on receipt.
// Channels are private: only tables the realtime.messages policies allow receive them.
function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function broadcast(topic: string, event: string): Promise<void> {
  return broadcastMany([{ topic, event }]);
}

// Several broadcasts in one request (D10: one POST, not one per topic).
export async function broadcastMany(
  messages: readonly { topic: string; event: string }[],
): Promise<void> {
  if (messages.length === 0) return;
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${env('SUPABASE_URL')}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(({ topic, event }) => ({ topic, event, payload: {}, private: true })),
    }),
  });
  if (!res.ok) throw new Error(`broadcast ${messages[0]?.event} failed (${res.status})`);
}
