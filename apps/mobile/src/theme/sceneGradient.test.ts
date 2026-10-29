import { describe, expect, it } from 'vitest';

import { clearOf, floorCss, sceneCss } from './sceneGradient';

describe('scene gradient', () => {
  it('fades a colour to its own hue with no alpha', () => {
    expect(clearOf('rgba(185, 166, 255, 0.55)')).toBe('rgba(185, 166, 255, 0)');
    expect(clearOf('#F3EEFF')).toBe('rgba(243, 238, 255, 0)');
  });

  it('lists the glows over the ground, the last glow on top', () => {
    const css = sceneCss({
      top: '#F3EEFF',
      bottom: '#FCF1F7',
      glows: [
        { color: 'rgba(1, 2, 3, 0.5)', cx: '15%', cy: '0%', rx: '90%', ry: '80%' },
        { color: 'rgba(4, 5, 6, 0.5)', cx: '50%', cy: '110%', rx: '70%', ry: '60%' },
      ],
    });
    expect(css).toBe(
      'radial-gradient(ellipse 70% 60% at 50% 110%, rgba(4, 5, 6, 0.5) 0%, rgba(4, 5, 6, 0) 70%), ' +
        'radial-gradient(ellipse 90% 80% at 15% 0%, rgba(1, 2, 3, 0.5) 0%, rgba(1, 2, 3, 0) 70%), ' +
        'linear-gradient(180deg, #F3EEFF, #FCF1F7)',
    );
  });

  it('fades the floor to its edge', () => {
    expect(floorCss('rgba(255, 255, 255, 0.95)')).toBe(
      'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)',
    );
  });
});
