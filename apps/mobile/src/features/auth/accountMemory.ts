import { useTableEndStore } from '../rooms/tableEnd';

// What an account change forgets (session.ts → noteUser): the conversations kept on the phone go
// with the account and with no account; the rest of what was read (the query cache, the photos,
// what this file clears) goes when one account follows another or signs out.
export function accountChange(
  previous: string | null | undefined,
  user: string | null,
): { conversations: boolean; memory: boolean } {
  return {
    conversations: user === null || (!!previous && previous !== user),
    memory: !!previous && previous !== user,
  };
}

// The app's own memory of the last account: Masa bitti's names and people (rooms/tableEnd.ts).
export function forgetAccountMemory(): void {
  useTableEndStore.setState({ tables: {} });
}
