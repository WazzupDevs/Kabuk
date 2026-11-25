// The purple night palette of the Atölye draft `purpleTheme` (the owner's ask, 22 Kasım; from the
// owner's reference picture): not used by any screen until the draft is approved.
export const PURPLE = {
  ground:
    'radial-gradient(55% 35% at 0% 22%, rgba(150, 90, 255, 0.34), transparent 70%), ' +
    'radial-gradient(50% 30% at 100% 70%, rgba(150, 90, 255, 0.28), transparent 70%), ' +
    'linear-gradient(180deg, #0E0A26 0%, #120E30 55%, #0A0820 100%)',
  ink: '#F3EEFF',
  muted: '#B7A9E0',
  accent: '#C27BFF',
  filled: 'linear-gradient(90deg, #B36BFF 0%, #8A4DFF 100%)',
  filledInk: '#FFFFFF',
  quiet: { fill: 'rgba(255, 255, 255, 0.06)', edge: 'rgba(190, 160, 255, 0.35)' },
  panel: { fill: 'rgba(30, 25, 62, 0.92)', edge: 'rgba(190, 160, 255, 0.18)' },
  chipOn: { fill: '#EDE4FF', ink: '#1B1540' },
  chipOff: { fill: 'rgba(255, 255, 255, 0.08)', ink: '#D8CCFF' },
  tile: 'rgba(255, 255, 255, 0.06)',
  light: { fill: 'linear-gradient(90deg, #F4EEFF 0%, #DCCBFF 100%)', ink: '#1B1540' },
} as const;
