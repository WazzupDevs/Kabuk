import { type JsxAST, parse, SvgAst } from 'react-native-svg';

// An SVG drawn from its text, the text read once for the whole app (the owner's report, 27 Ekim:
// the app felt heavy). react-native-svg's SvgXml reads the text again in every place it is drawn;
// the icons, the capsules and the reaction faces repeat the same few texts in every list.
const read = new Map<string, JsxAST | null>();
const KEEP = 600;

function ast(xml: string): JsxAST | null {
  const hit = read.get(xml);
  if (hit !== undefined) return hit;
  if (read.size >= KEEP) read.clear();
  const tree = parse(xml);
  read.set(xml, tree);
  return tree;
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
  return <SvgAst ast={ast(xml)} override={{ width, height }} />;
}
