import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

// The navigation buttons' colour by the app's theme (modules/skall-glass →
// setLightNavigationBar): Android draws no shade of its own behind them (app.config.ts →
// withClearNavigationBar). A build from before 0.9.2 has no such function and keeps its own.
type SkallGlass = { setLightNavigationBar?: (light: boolean) => Promise<void> };
const native =
  Platform.OS === 'android' ? requireOptionalNativeModule<SkallGlass>('SkallGlass') : null;

export function setLightNavigationBar(light: boolean): void {
  // An older build or no window yet: its own colour stays.
  void native?.setLightNavigationBar?.(light).catch(() => undefined);
}
