// The web preview (scripts/visual/web-shot.ts): react-native-web has no "reduce transparency"
// setting. Answers false, as Android does (useReduceTransparency.ts).
export function useReduceTransparency(): boolean {
  return false;
}
