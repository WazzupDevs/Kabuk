// What the inventory measures but does not write down: a component whose background is a gradient
// is recorded as `gradient`. Its value, from v46's own CSS (docs/design/v46/skall-masa-deneme-v46.html)
// and the gallery's measurement (`?page=galeri&format=json` → background-image), each with its rule.
// Nothing else belongs here; a value the inventory has is read from the inventory.
import type { Scheme } from './inventory.ts';

export type GradientSource = { rule: Record<Scheme, string>; value: Record<Scheme, string> };

export const GRADIENTS: Record<string, GradientSource> = {
  // The floating tab bar. v46 also blurs what is behind it (backdrop-filter: blur(20px)
  // saturate(1.9)); the app has no blur yet and draws the gradient alone (owner, 20 October).
  nav: {
    rule: { light: '.va .nav', dark: 'html[data-theme="dark"] .va .nav' },
    value: {
      light: 'linear-gradient(135deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.2))',
      dark: 'linear-gradient(135deg, rgba(28, 24, 56, 0.62), rgba(28, 24, 56, 0.2))',
    },
  },
};

// Which inventory components wear which gradient.
export const COMPONENT_GRADIENTS: Record<string, keyof typeof GRADIENTS> = {
  'alt-sekme-mekan': 'nav',
  'alt-sekme-mesajlar': 'nav',
  'alt-sekme-profil': 'nav',
};
