// Every open sheet, menu and held message closes at once (the owner's request card coming in,
// audit UI-2): one store keeps what is open (lib/overlayStore.ts), so this is its `closeAll`.
export { closeAllSheets } from '../lib/overlayStore';
