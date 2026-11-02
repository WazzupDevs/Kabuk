import { describe, expect, it } from 'vitest';

import { gradientStyle } from '../theme/gradient';

describe('gradientStyle', () => {
  it('draws a gradient as the background image', () => {
    const css = 'linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.54))';
    expect(gradientStyle(css)).toEqual({ experimental_backgroundImage: css });
  });

  it('draws a flat colour (the dark glass) as the background colour', () => {
    expect(gradientStyle('#121614')).toEqual({ backgroundColor: '#121614' });
  });
});
