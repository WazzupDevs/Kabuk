import type { ViewStyle } from 'react-native';

// The one place that names React Native's gradient style: `experimental_backgroundImage` in RN 0.86,
// renamed in a later release. A component asks for a gradient through this, with the CSS string the
// theme gives (e.g. the glass face's); styleGuard.test.ts keeps the name here.
export function gradientStyle(css: string): ViewStyle {
  return { experimental_backgroundImage: css };
}

export { svgGradient, type SvgGradient } from './svgGradient';
