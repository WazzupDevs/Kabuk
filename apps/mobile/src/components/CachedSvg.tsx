import { type JsxAST, parse, SvgAst } from 'react-native-svg';

import { createLru } from '@/lib/lru';
import { svgKey, textKey } from '@/lib/svgKey';

// An SVG drawn from its text, the text read once for the whole app (the owner's report, 27 Ekim:
// the app felt heavy). react-native-svg's SvgXml reads the text again in every place it is drawn;
// the icons, the capsules and the reaction faces repeat the same few texts in every list.
// With the text's name: every view of the same text shares its picture (lib/svgKey.ts).
const KEEP = 600;
const read = createLru<{ tree: JsxAST | null; key: string }>(KEEP);

function ast(xml: string): { tree: JsxAST | null; key: string } {
  const hit = read.get(xml);
  if (hit !== undefined) return hit;
  const entry = { tree: parse(xml), key: svgKey('xml', textKey(xml)) };
  read.set(xml, entry);
  return entry;
}

// Reads a text ahead, in idle time, so that showing it later has nothing left to read (Kapsülünü
// süsle reads its other tabs' options while the person looks at one).
export function readAhead(xml: string): void {
  ast(xml);
}

export function CachedSvg({
  xml,
  width,
  height,
}: {
  xml: string;
  width: number | `${number}%`;
  height: number | `${number}%`;
}) {
  const { tree, key } = ast(xml);
  return <SvgAst ast={tree} override={{ width, height, nativeID: key }} />;
}
