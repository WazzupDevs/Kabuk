import { describe, expect, it } from 'vitest';

import { keyframeChannels, parseKeyframes } from './keyframes.ts';

describe('parseKeyframes', () => {
  it("reads v46's keyframes in time order", () => {
    expect(parseKeyframes('25%{transform:translateX(-5px)}75%{transform:translateX(5px)}')).toEqual(
      [
        { at: 0.25, translateX: -5 },
        { at: 0.75, translateX: 5 },
      ],
    );
    expect(
      parseKeyframes(
        '0%{transform:translateX(0);opacity:1}40%{transform:translateX(22px);opacity:0}' +
          '41%{transform:translateX(-22px);opacity:0}100%{transform:translateX(0);opacity:1}',
      ),
    ).toEqual([
      { at: 0, translateX: 0, opacity: 1 },
      { at: 0.4, translateX: 22, opacity: 0 },
      { at: 0.41, translateX: -22, opacity: 0 },
      { at: 1, translateX: 0, opacity: 1 },
    ]);
  });

  it('splits a shared selector and reads from, to, rotate and scale', () => {
    expect(parseKeyframes('from,to{transform:scale(.5)}50%{transform:rotate(-13deg)}')).toEqual([
      { at: 0, scale: 0.5 },
      { at: 0.5, rotate: -13 },
      { at: 1, scale: 0.5 },
    ]);
  });

  it('stops at what React Native would not draw the same', () => {
    expect(() => parseKeyframes('50%{transform:skewX(4deg)}')).toThrow(/skewX/);
    expect(() => parseKeyframes('50%{filter:blur(2px)}')).toThrow(/filter/);
  });
});

describe('keyframeChannels', () => {
  it("fills 0% and 100% with the element's own value", () => {
    const nope = parseKeyframes('25%{transform:translateX(-5px)}75%{transform:translateX(5px)}');
    expect(keyframeChannels(nope, 360)).toEqual({
      translateX: {
        from: 0,
        steps: [
          { to: -5, ms: 90 },
          { to: 5, ms: 180 },
          { to: 0, ms: 90 },
        ],
      },
    });
  });

  it('gives each channel the steps between its own keyframes', () => {
    const frames = parseKeyframes(
      '0%{transform:scale(.5)}60%{transform:scale(1.22)}50%{opacity:.4}100%{transform:scale(1)}',
    );
    expect(keyframeChannels(frames, 450)).toEqual({
      scale: {
        from: 0.5,
        steps: [
          { to: 1.22, ms: 270 },
          { to: 1, ms: 180 },
        ],
      },
      opacity: {
        from: 1,
        steps: [
          { to: 0.4, ms: 225 },
          { to: 1, ms: 225 },
        ],
      },
    });
  });
});
