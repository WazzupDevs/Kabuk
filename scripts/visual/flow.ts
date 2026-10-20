// The visual gate's Maestro flows (CLAUDE.md → Görsel kapı), one file per shot so a failing
// comparison never stops the rest: open the state's route, wait for it to settle, photograph its
// frame (the candidate) and, when a baseline exists, assertScreenshot against it. Written by
// make-flows.ts.
import { baselinePath, hasBaseline, type Shot } from './states.ts';

export const CANDIDATE = 'aday__';
export const CANDIDATE_AGAIN = 'aday2__';

export function shotLink(shot: Shot, n: number): string {
  const q = [
    `durum=${shot.state.app}`,
    `tema=${shot.theme}`,
    `sayfa=${shot.page - 1}`,
    `sayfalar=${shot.pages}`,
    `n=${n}`,
  ];
  return `masa:///gorsel?${q.join('&')}`;
}

function open(shot: Shot, n: number): string[] {
  return [
    `- openLink: "${shotLink(shot, n)}"`,
    '- extendedWaitUntil:',
    '    notVisible:',
    '      id: launch-curtain',
    '    timeout: 60000',
    '- extendedWaitUntil:',
    '    visible:',
    `      id: gorsel-hazir-${n}`,
    '    timeout: 60000',
    // The route knows the state, and the list has its page count right (GateState).
    '- assertNotVisible:',
    '    id: gorsel-yok',
    '- assertNotVisible:',
    '    id: gorsel-eksik-sayfa',
  ];
}

function photo(prefix: string, shot: Shot): string[] {
  return [
    '- takeScreenshot:',
    `    path: ${prefix}${shot.name}`,
    '    cropOn:',
    '      id: gorsel-cerceve',
  ];
}

export function flowFor(
  root: string,
  shot: Shot,
  n: number,
  threshold: number,
  again: boolean,
): string {
  const lines = [
    'appId: app.kabuk.mobile',
    `name: ${shot.name}`,
    '---',
    ...open(shot, n),
    ...photo(CANDIDATE, shot),
  ];
  if (again) lines.push(...open(shot, n + 100000), ...photo(CANDIDATE_AGAIN, shot));
  if (shot.baseline && hasBaseline(root, shot)) {
    lines.push(
      '- assertScreenshot:',
      `    path: ${baselinePath(root, shot)}`,
      '    cropOn:',
      '      id: gorsel-cerceve',
      `    thresholdPercentage: ${threshold}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
