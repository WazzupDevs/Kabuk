import type { ViewStyle } from 'react-native';

// The web preview (scripts/visual/web-shot.ts) only; Android and iOS resolve gradient.ts. React
// Native's gradient style is not one react-native-web knows: the browser's own `background-image`
// draws the same CSS string. Not a React Native style name, hence the cast.
export function gradientStyle(css: string): ViewStyle {
  return /gradient\(/.test(css)
    ? ({ backgroundImage: css } as unknown as ViewStyle)
    : { backgroundColor: css };
}

export { svgGradient, type SvgGradient } from './svgGradient';
