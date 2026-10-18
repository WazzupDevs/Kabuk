// A random UUID (version 4) for a request the app may send twice (pure/apiRetry.ts →
// IDEMPOTENT_CALLS): the server takes the second for the first. Math.random is enough: the key only
// has to differ from the same account's other requests, and the server matches it to the account.
// No package for it: expo-crypto is native and would need a new build.
export function requestKey(random: () => number = Math.random): string {
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(random() * 16).toString(16)).join('');
  const variant = (8 + Math.floor(random() * 4)).toString(16);
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`;
}
