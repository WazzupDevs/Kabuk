// The sign-up steps in order (docs/SPEC_V4.md §4.C, K-19 and K-33; the v45 report §1): the consents
// come first, before the phone. "1/7" over each step comes from here.
export const SIGNUP_STEPS = [
  'consents',
  'phone',
  'code',
  'name',
  'birth',
  'gender',
  'photo',
] as const;
export type SignupStep = (typeof SIGNUP_STEPS)[number];

export const SIGNUP_TOTAL = SIGNUP_STEPS.length;

// 1 for the consents … 7 for the photo.
export function stepNumber(step: SignupStep): number {
  return SIGNUP_STEPS.indexOf(step) + 1;
}

// The last step's button (K-29): "Bitir", or "Fotoğrafsız bitir" while no photo is set.
export function finishLabel(
  photoSet: boolean,
  labels: { finish: string; noPhoto: string },
): string {
  return photoSet ? labels.finish : labels.noPhoto;
}
