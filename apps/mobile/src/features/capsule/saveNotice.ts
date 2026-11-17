// Kapsülünü süsle's failed save has one top notice (the owner's report, 17 Kasım: "Kaydet ve çık"
// failing showed two, the dialog's and the screen's, one over the other). The dialog says it when
// the save was started from it; the screen says it for the bar's Kaydet.
export function saveNoticeShown(input: { failed: boolean; fromDialog: boolean }): boolean {
  return input.failed && !input.fromDialog;
}
