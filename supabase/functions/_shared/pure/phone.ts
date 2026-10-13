// Only Turkish mobile numbers (+90 5xx xxx xx xx) are accepted in the MVP.
// The before_user_created auth hook enforces the same rule on the server.
export function toTrMobileE164(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^5\d{9}$/.test(digits) ? `+90${digits}` : null;
}

// A number as the screen shows it: "+90 555 000 00 01". Anything not a Turkish mobile number is
// shown as it came.
export function formatTrMobile(input: string): string {
  const e164 = toTrMobileE164(input);
  if (!e164) return input;
  const d = e164.slice(3);
  return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}
