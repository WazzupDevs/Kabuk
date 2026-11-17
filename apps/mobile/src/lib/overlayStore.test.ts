import { beforeEach, describe, expect, it, vi } from 'vitest';

import { closeAllSheets } from '../components/sheetCloser';
import { closeAllOverlays, closeOverlay, openOverlay, type OverlayEntry } from './overlayModel';
import {
  closeAll,
  closeOverlay as closeStored,
  confirm,
  type ConfirmOptions,
  isConfirm,
  openOverlay as openStored,
  retryDialogAction,
  runDialogAction,
  useDialogRun,
  useOverlay,
} from './overlayStore';

const entry = (id: string, kind: OverlayEntry<null>['kind'] = 'dialog'): OverlayEntry<null> => ({
  id,
  kind,
  payload: null,
});

describe('overlayModel', () => {
  it('opens one and keeps only one open', () => {
    const first = openOverlay({ open: null }, entry('a', 'menu'));
    expect(first.state.open?.id).toBe('a');
    expect(first.closed).toBeNull();
    const second = openOverlay(first.state, entry('b'));
    expect(second.state.open?.id).toBe('b');
    expect(second.closed?.id).toBe('a');
  });

  it('a confirmation from a menu or a held message takes its place', () => {
    for (const kind of ['menu', 'hold'] as const) {
      const step = openOverlay({ open: entry('m', kind) }, entry('d', 'dialog'));
      expect(step.state.open?.kind).toBe('dialog');
      expect(step.closed?.kind).toBe(kind);
    }
  });

  it('closes only the one still open', () => {
    const state = { open: entry('b') };
    expect(closeOverlay(state, 'a')).toEqual({ state, closed: null });
    expect(closeOverlay(state, 'b')).toEqual({ state: { open: null }, closed: state.open });
  });

  it('closes all', () => {
    expect(closeAllOverlays({ open: entry('a') }).state.open).toBeNull();
    expect(closeAllOverlays({ open: null }).closed).toBeNull();
  });
});

function options(extra: Partial<ConfirmOptions> = {}): ConfirmOptions {
  return {
    title: 't',
    note: 'n',
    tone: 'plain',
    confirmLabel: 'ok',
    cancelLabel: 'no',
    onConfirm: () => undefined,
    ...extra,
  };
}

describe('overlayStore', () => {
  beforeEach(() => {
    closeAll();
  });

  it('a new confirmation replaces the one open and dismisses it', () => {
    const onCancel = vi.fn();
    const first = confirm(options({ onCancel }));
    const second = confirm(options());
    expect(useOverlay.getState().open?.id).toBe(second);
    expect(second).not.toBe(first);
    expect(onCancel).toHaveBeenCalledTimes(1);
    const open = useOverlay.getState().open;
    expect(open && isConfirm(open.payload)).toBe(true);
  });

  it('a late close of a replaced one changes nothing', () => {
    const first = confirm(options());
    const second = confirm(options());
    closeStored(first);
    expect(useOverlay.getState().open?.id).toBe(second);
  });

  it('closing after its own action does not dismiss it', () => {
    const onCancel = vi.fn();
    const id = confirm(options({ onCancel }));
    closeStored(id, false);
    expect(useOverlay.getState().open).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('closeAll closes it and dismisses it once', () => {
    const onCancel = vi.fn();
    confirm(options({ onCancel }));
    closeAll();
    closeAll();
    expect(useOverlay.getState().open).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closeAllSheets closes the store too', () => {
    const onDismiss = vi.fn();
    openStored('menu', { render: () => null }, onDismiss);
    closeAllSheets();
    expect(useOverlay.getState().open).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('closeAllSheets is the store closeAll', () => {
    expect(closeAllSheets).toBe(closeAll);
  });

  it('a sheet, a held message and a menu close each other, one open at a time', () => {
    const owned = { owned: true } as const;
    const sheet = vi.fn();
    const hold = vi.fn();
    const menu = vi.fn();
    openStored('sheet', owned, sheet);
    const held = openStored('hold', owned, hold);
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(useOverlay.getState().open?.id).toBe(held);
    const opened = openStored('menu', owned, menu);
    expect(hold).toHaveBeenCalledTimes(1);
    expect(useOverlay.getState().open?.kind).toBe('menu');
    openStored('sheet', owned, sheet);
    expect(menu).toHaveBeenCalledTimes(1);
    // The menu closed again by its own screen: nothing is dismissed twice.
    closeStored(opened, false);
    expect(useOverlay.getState().open?.kind).toBe('sheet');
    expect(sheet).toHaveBeenCalledTimes(1);
  });

  it('a confirmation closes the sheet it opens from; closeAll closes the sheet', () => {
    const sheet = vi.fn();
    openStored('sheet', { owned: true }, sheet);
    const id = confirm(options());
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(useOverlay.getState().open?.id).toBe(id);
    const again = vi.fn();
    openStored('sheet', { owned: true }, again);
    closeAllSheets();
    expect(again).toHaveBeenCalledTimes(1);
    expect(useOverlay.getState().open).toBeNull();
  });

  it('a failed try keeps the dialog open with its error; the next try clears it and closes', async () => {
    const onCancel = vi.fn();
    const id = confirm(options({ onCancel }));
    const failure = new Error('x');
    const task = () => Promise.reject(failure);
    expect(await runDialogAction(id, 'confirm', task)).toBe(false);
    expect(useOverlay.getState().open?.id).toBe(id);
    expect(useDialogRun.getState()).toEqual({
      id,
      running: null,
      error: failure,
      failed: { which: 'confirm', task, n: 1 },
    });
    expect(await runDialogAction(id, 'other', () => undefined)).toBe(true);
    expect(useOverlay.getState().open).toBeNull();
    expect(useDialogRun.getState().error).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('"Tekrar dene" runs the failed way again; each failure counts, a success closes', async () => {
    const id = confirm(options());
    expect(await retryDialogAction(id)).toBe(false);
    let tries = 0;
    const task = () => {
      tries += 1;
      if (tries < 3) throw new Error('z');
    };
    expect(await runDialogAction(id, 'other', task)).toBe(false);
    expect(await retryDialogAction(id)).toBe(false);
    expect(useDialogRun.getState().failed).toEqual({ which: 'other', task, n: 2 });
    expect(await retryDialogAction(id)).toBe(true);
    expect(tries).toBe(3);
    expect(useOverlay.getState().open).toBeNull();
    expect(useDialogRun.getState().failed).toBeNull();
  });

  it('one way at a time; a new dialog starts with no error', async () => {
    const id = confirm(options());
    let done: () => void = () => undefined;
    const first = runDialogAction(id, 'other', () => new Promise<void>((r) => (done = r)));
    expect(useDialogRun.getState().running).toBe('other');
    expect(await runDialogAction(id, 'confirm', () => undefined)).toBe(false);
    done();
    expect(await first).toBe(true);
    const next = confirm(options());
    await runDialogAction(next, 'confirm', () => Promise.reject(new Error('y')));
    const again = confirm(options());
    expect(useDialogRun.getState()).toEqual({
      id: again,
      running: null,
      error: null,
      failed: null,
    });
    expect(await runDialogAction(next, 'confirm', () => undefined)).toBe(false);
  });
});
