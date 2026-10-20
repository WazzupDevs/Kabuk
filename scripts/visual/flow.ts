// The visual gate's Maestro flows (CLAUDE.md → Görsel kapı), one file per shot so a failing
// comparison never stops the rest: open the state's route, wait for it to settle,
// photograph its frame (the candidate) and, when a baseline exists, assertScreenshot against it.
// Written by make-flows.ts.
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

// A shot opens on the running app: the route resets the state from its address (a fresh mount per
// shot number, the clock frozen, the random sequence seeded again; apps/mobile/app/gorsel.tsx
// drops the earlier states' screens). Only when the state has not settled in 20 s is the app
// started afresh and the state opened once more (the first shot starts it anyway).
function open(shot: Shot, n: number): string[] {
  const link = `- openLink: "${shotLink(shot, n)}"`;
  const settle = (timeout: number, optional: boolean) => [
    '- extendedWaitUntil:',
    '    notVisible:',
    '      id: launch-curtain',
    '    timeout: 60000',
    '- extendedWaitUntil:',
    '    visible:',
    `      id: gorsel-hazir-${n}`,
    `    timeout: ${timeout}`,
    ...(optional ? ['    optional: true'] : []),
  ];
  return [
    link,
    ...settle(20000, true),
    '- runFlow:',
    '    when:',
    '      notVisible:',
    `        id: gorsel-hazir-${n}`,
    '    commands:',
    '      - stopApp',
    ...[link, ...settle(60000, false)].map((l) => `      ${l}`),
    // The route knows the state, and the list has its page count right (GateState).
    '- assertNotVisible:',
    '    id: gorsel-yok',
    '- assertNotVisible:',
    '    id: gorsel-eksik-sayfa',
  ];
}

// A system "… isn't responding" dialog (Pixel Launcher, on the 2-core emulator) is never in the
// photo: Wait is pressed first (scripts/e2e/system-dialog.sh does the same before the flows).
const DISMISS_SYSTEM_DIALOG = [
  '- runFlow:',
  '    when:',
  '      visible:',
  '        id: android:id/aerr_wait',
  '    commands:',
  '      - tapOn:',
  '          id: android:id/aerr_wait',
];

function photo(prefix: string, shot: Shot): string[] {
  return [
    ...DISMISS_SYSTEM_DIALOG,
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
