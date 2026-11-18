// The visual gate's Maestro flows (CLAUDE.md → Görsel kapı), one file per shot so a failing
// comparison never stops the rest: open the state's route, wait for it to settle, do the state's
// app steps (a real button pressed, time let run), photograph its frame (the candidate) and, when a
// baseline of the emulator's size exists, assertScreenshot against it. Written by make-flows.ts.
import { type AppStep, baselinePath, hasBaseline, type Shot, staleBaseline } from './states.ts';

// A testID no screen has: waiting for it to show is a plain wait of its timeout.
export const NEVER_THERE = 'gorsel-bekle';

// The state's app steps as Maestro commands: `bas` taps the element by its testID (Maestro waits
// for it to be there), `bekle` waits that long.
export function appSteps(steps: readonly AppStep[]): string[] {
  return steps.flatMap((step) =>
    'bas' in step
      ? ['- tapOn:', `    id: ${step.bas}`]
      : [
          '- extendedWaitUntil:',
          '    visible:',
          `      id: ${NEVER_THERE}`,
          `    timeout: ${step.bekle}`,
          '    optional: true',
        ],
  );
}

export const CANDIDATE = 'aday__';
export const CANDIDATE_AGAIN = 'aday2__';

export function shotLink(shot: Shot, n: number): string {
  const q = [
    `durum=${shot.state.app}`,
    `tema=${shot.theme}`,
    `sayfa=${shot.page - 1}`,
    `sayfalar=${shot.pages}`,
    ...(shot.state.genislik ? [`genislik=${shot.state.genislik}`] : []),
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
    // The route knows the state, and the list has its page count right (GateState): one n at a
    // time, so a wrong count's failure names the count it takes (gate-report.ts → pageHints).
    '- assertNotVisible:',
    '    id: gorsel-yok',
    ...pageCheck(),
    ...appSteps(shot.state.uygulamaAdimlar ?? []),
  ];
}

// GateState's wrong-page-count banner carries `gorsel-sayfa-gereken-<n>`, n the pages the state
// takes; checked for 1 … PAGE_NEEDED_MAX by name, then the banner itself (a count above it).
export const PAGE_NEEDED = 'gorsel-sayfa-gereken-';
export const PAGE_NEEDED_MAX = 10;
export function pageCheck(): string[] {
  return [
    ...Array.from({ length: PAGE_NEEDED_MAX }, (_, i) => [
      '- assertNotVisible:',
      `    id: ${PAGE_NEEDED}${i + 1}`,
    ]).flat(),
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

// What the photo is cropped to: the state's own element (`uygulamaKirp`), else the frame, except
// after app steps: what they open (a menu) can be its own window (a Modal) above the route's, and
// while it is open Maestro does not see the frame (PR #739's first run: "Element not found:
// gorsel-cerceve"), so the whole screen is photographed. A full screen state's frame is the whole
// screen anyway (780 × 1688); a dialog drawn in the route (ekran-semt-oturum-kapat) needs no step.
export function cropId(shot: Shot): string | null {
  if (shot.state.uygulamaKirp) return shot.state.uygulamaKirp;
  if ((shot.state.uygulamaAdimlar ?? []).length > 0) return null;
  return 'gorsel-cerceve';
}
const cropOn = (shot: Shot): string[] => {
  const id = cropId(shot);
  return id ? ['    cropOn:', `      id: ${id}`] : [];
};

function photo(prefix: string, shot: Shot): string[] {
  return [
    ...DISMISS_SYSTEM_DIALOG,
    '- takeScreenshot:',
    `    path: ${prefix}${shot.name}`,
    ...cropOn(shot),
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
  if (shot.baseline && hasBaseline(root, shot) && !staleBaseline(root, shot)) {
    lines.push(
      '- assertScreenshot:',
      `    path: ${baselinePath(root, shot)}`,
      ...cropOn(shot),
      `    thresholdPercentage: ${threshold}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
