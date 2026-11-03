import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runSheetSlide, type Slide } from './sheetSlide';

function fakeSlide() {
  let done: ((r: { finished: boolean }) => void) | undefined;
  const slide: Slide = {
    start: (cb) => {
      done = cb;
    },
    stop: () => done?.({ finished: false }),
  };
  return { slide, end: (finished: boolean) => done?.({ finished }) };
}

describe('runSheetSlide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('unmounts when the closing slide ends', () => {
    const { slide, end } = fakeSlide();
    const unmount = vi.fn();
    runSheetSlide(slide, true, unmount, 600);
    end(true);
    expect(unmount).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('unmounts when the closing slide is interrupted from elsewhere', () => {
    const { slide, end } = fakeSlide();
    const unmount = vi.fn();
    runSheetSlide(slide, true, unmount, 600);
    end(false);
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('unmounts after the fallback when the slide never reports its end', () => {
    const { slide } = fakeSlide();
    const unmount = vi.fn();
    runSheetSlide(slide, true, unmount, 600);
    vi.advanceTimersByTime(599);
    expect(unmount).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('stays mounted when its own cleanup stops the slide (a newer slide takes over)', () => {
    const { slide } = fakeSlide();
    const unmount = vi.fn();
    const cleanup = runSheetSlide(slide, true, unmount, 600);
    cleanup();
    vi.advanceTimersByTime(1000);
    expect(unmount).not.toHaveBeenCalled();
  });

  it('never unmounts on an opening slide', () => {
    const { slide, end } = fakeSlide();
    const unmount = vi.fn();
    runSheetSlide(slide, false, unmount, 600);
    end(false);
    vi.advanceTimersByTime(1000);
    expect(unmount).not.toHaveBeenCalled();
  });

  it('handles a slide that ends at once (reduce motion)', () => {
    const unmount = vi.fn();
    const slide: Slide = { start: (cb) => cb?.({ finished: true }), stop: () => undefined };
    runSheetSlide(slide, true, unmount, 600);
    vi.advanceTimersByTime(1000);
    expect(unmount).toHaveBeenCalledTimes(1);
  });
});
