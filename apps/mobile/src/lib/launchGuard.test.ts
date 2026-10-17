import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLaunchGuard, SPLASH_CAP_MS } from './launchGuard';

function setup(hideSplash: () => Promise<unknown> | void = () => Promise.resolve()) {
  const io = {
    hideSplash: vi.fn(hideSplash),
    dropCurtain: vi.fn(),
    report: vi.fn(),
  };
  return { io, guard: createLaunchGuard(io) };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the cap: the system splash never outlives the curtain', () => {
  it('a curtain that never begins: the splash goes and the curtain is dropped at the cap', () => {
    const { io } = setup();
    vi.advanceTimersByTime(SPLASH_CAP_MS - 1);
    expect(io.hideSplash).not.toHaveBeenCalled();
    expect(io.dropCurtain).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
    expect(io.report).not.toHaveBeenCalled();
  });

  it('a curtain that begins: the splash goes at its first frame, once; the cap leaves it be', () => {
    const { io, guard } = setup();
    vi.advanceTimersByTime(400);
    guard.begin();
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SPLASH_CAP_MS * 2);
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).not.toHaveBeenCalled();
  });

  it('a curtain that begins after the cap: it was dropped and stays dropped', () => {
    const { io, guard } = setup();
    vi.advanceTimersByTime(SPLASH_CAP_MS);
    guard.begin();
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
  });

  it('the error screen releases the splash; a curtain that has not begun still goes at the cap', () => {
    const { io, guard } = setup();
    guard.release();
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SPLASH_CAP_MS);
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
  });

  it('a splash that cannot be hidden (rejects or throws) does not throw', async () => {
    const rejecting = setup(() => Promise.reject(new Error('no splash')));
    expect(() => vi.advanceTimersByTime(SPLASH_CAP_MS)).not.toThrow();
    await vi.runAllTimersAsync();
    expect(rejecting.io.dropCurtain).toHaveBeenCalledTimes(1);

    const throwing = setup(() => {
      throw new Error('no splash');
    });
    expect(() => throwing.guard.begin()).not.toThrow();
  });
});

describe('a failed curtain', () => {
  it('is dropped and reported once, and the splash goes', () => {
    const { io, guard } = setup();
    const error = new Error('svg');
    guard.begin();
    vi.advanceTimersByTime(800);
    guard.fail(error);
    guard.fail(new Error('again'));
    expect(io.report).toHaveBeenCalledTimes(1);
    expect(io.report).toHaveBeenCalledWith(error);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
  });

  it('before its first frame: the splash goes at once, not at the cap', () => {
    const { io, guard } = setup();
    vi.advanceTimersByTime(100);
    guard.fail(new Error('layout'));
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SPLASH_CAP_MS);
    expect(io.hideSplash).toHaveBeenCalledTimes(1);
    expect(io.dropCurtain).toHaveBeenCalledTimes(1);
  });
});
