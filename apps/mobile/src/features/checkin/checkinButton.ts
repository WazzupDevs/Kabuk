// "Konumumu kullan" (docs/design/aura/aktarim-37-checkin.md → Check-in düğmesi). Taking the
// position, the server's check and the way to Mekan are one waiting state: the label stays
// "Konum alınıyor…" from the press after the permission until Mekan opens, and the button never
// turns back idle on the way (a check-in that went through stays waiting, K4). Every problem
// ends it. Until a venue with spots has its spot chosen it is off.
export type CheckinButton = { busy: boolean; off: boolean };

export function checkinButton({
  locating,
  sending,
  sent,
  spotsLoading,
  needsSpot,
}: {
  // The position being taken, or the check-in on its way (set together before the call).
  locating: boolean;
  // The call itself (the mutation pending, its success handler included).
  sending: boolean;
  // The server took it: the sheet is on its way to Mekan.
  sent: boolean;
  spotsLoading: boolean;
  // A venue with spots, none chosen yet.
  needsSpot: boolean;
}): CheckinButton {
  const busy = locating || sending || sent;
  return { busy, off: !busy && (spotsLoading || needsSpot) };
}
