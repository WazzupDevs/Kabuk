// Whether a shard's failed attempt in CI is run once more (.github/workflows/e2e.yml): only when
// the test environment fell over, never because a step failed. Maestro drives the phone through a
// driver it installs there (dev.mobile.maestro, an instrumentation); when that driver crashes or
// cannot be reached, the next step fails as "Element not found" or an assertion although the app
// did nothing wrong (#151's dark-1 and dark-4: "Element not found: welcome-start", with the driver
// gone). A failing step without one of those signs is a real failure and is never run again: #161's
// check-in race came and went, and a retry would have hidden it.
//
// Android logs "Crash of app dev.mobile.maestro running instrumentation" at the end of every run,
// green ones too, when Maestro stops its driver: on 19 Oct the e2e-screenshots branches held 476
// shard runs, and the line was in every job's logcat. So the line alone proves nothing; it counts
// only while the flow was running:
// - in Maestro's own copy of the phone's log (`logs/device-logcat.txt` under --test-output-dir),
//   which covers the flow and is read before Maestro stops its driver: in none of those 476, #103's
//   real assertion failure among them; or
// - in the job's own logcat, at least CRASH_MARGIN_MS before the failed step started (its RUNNING
//   line in maestro.log). The emulator's clock can lag Maestro's by half a second (247d8dc large-4:
//   Maestro 13:52:12.238, the phone 13:52:11.757), and on a real failure Maestro's own stop writes
//   the line ~1 s after the FAILED line (19 Oct nightly large-1: FAILED 06:29:03.730, the line
//   06:29:04.611). A step waits seconds for its element before failing, so a margin from its
//   start keeps that stop line out; #151's crash came 15 s before its step failed.
// A driver Maestro cannot reach shows in what Maestro prints, logs or reports: #164's test run
// (5b07df55, light-2) reported "maestro.android.DeviceServerDiedException: Device server died
// during 'viewHierarchy' … StatusRuntimeException: UNAVAILABLE" in report.xml alone.

export type Attempt = {
  // Maestro's log of the flow (logs/maestro.log under --test-output-dir).
  maestroLog: string;
  // Maestro's copy of the phone's log over the flow (logs/device-logcat.txt).
  deviceLogcat: string;
  // `adb logcat '*:W'` over the whole attempt (scripts/e2e/run-on-emulator.sh), Maestro's stop
  // included.
  logcat: string;
  // What `maestro test` printed.
  console: string;
  // Maestro's JUnit report (report.xml), its failure message.
  report: string;
};

const DRIVER_CRASH = /Crash of app dev\.mobile\.maestro\b/;
// Maestro could not reach its driver: it did not start, or the connection to it is gone (gRPC
// UNAVAILABLE: the driver's port answers no more).
const UNREACHABLE = [
  /Maestro Android driver did not start up in time/,
  /DeviceServerDiedException/,
  /StatusRuntimeException: UNAVAILABLE/,
];
const DAY_MS = 24 * 60 * 60 * 1000;
export const CRASH_MARGIN_MS = 5_000;

// Why the attempt is run once more (one line, for the job summary), or null.
export function retryReason(a: Attempt): string | null {
  if (DRIVER_CRASH.test(a.deviceLogcat)) {
    return "Maestro'nun telefondaki sürücüsü akış sürerken çöktü (Maestro'nun cihaz logunda `Crash of app dev.mobile.maestro`)";
  }
  const failed = failedStep(a.maestroLog);
  if (failed) {
    const latest = (failed.started.ms - CRASH_MARGIN_MS + DAY_MS) % DAY_MS;
    const crash = driverCrashesInLogcat(a.logcat).find(
      (at) => at.ms === latest || before(at.ms, latest),
    );
    if (crash) {
      return `Maestro'nun telefondaki sürücüsü ${crash.time}'da çöktü, düşen adım ${failed.started.time}'da başlamıştı (logcat: \`Crash of app dev.mobile.maestro\`)`;
    }
  }
  for (const text of [a.report, a.console, a.maestroLog]) {
    for (const pattern of UNREACHABLE) {
      const line = text.split('\n').find((l) => pattern.test(l));
      if (line) {
        return `Maestro telefondaki sürücüsüne ulaşamadı (\`${pattern.source.replaceAll('\\', '')}\`)`;
      }
    }
  }
  return null;
}

type At = { time: string; ms: number };

// The first step that failed (maestro.log's first "…onCommandFinished: <step> FAILED"; the step
// itself, before the flows around it) and when it started: the last "…onCommandStart: <step>
// RUNNING" before it.
export function failedStep(maestroLog: string): { started: At; failed: At } | null {
  const started = new Map<string, string>();
  for (const line of maestroLog.split('\n')) {
    const m = /^(\d\d:\d\d:\d\d\.\d{3}) .*onCommand(Start|Finished): (.*) (RUNNING|FAILED)$/.exec(
      line,
    );
    if (!m?.[1] || !m[3]) continue;
    if (m[2] === 'Start' && m[4] === 'RUNNING') started.set(m[3], m[1]);
    if (m[2] === 'Finished' && m[4] === 'FAILED') {
      const start = started.get(m[3]);
      return start ? { started: at(start), failed: at(m[1]) } : null;
    }
  }
  return null;
}

// Logcat's "MM-DD HH:MM:SS.mmm  pid  tid W ActivityManager: Crash of app dev.mobile.maestro …".
export function driverCrashesInLogcat(logcat: string): At[] {
  return [...logcat.matchAll(/^\d\d-\d\d (\d\d:\d\d:\d\d\.\d{3}) .*$/gm)]
    .filter((m) => DRIVER_CRASH.test(m[0]))
    .map((m) => at(m[1] ?? ''));
}

// "HH:MM:SS.mmm": the time to the second (for the summary) and the time of day in milliseconds.
function at(time: string): At {
  const [h = 0, m = 0, s = 0, ms = 0] = time.split(/[:.]/).map(Number);
  return { time: time.slice(0, 8), ms: ((h * 60 + m) * 60 + s) * 1000 + ms };
}

// Both clocks are the runner's (UTC; the emulator takes the host's time), and maestro.log carries
// no date: within half a day, `a` is before `b` (an attempt lasts well under an hour; a run that
// passes midnight still compares right).
function before(a: number, b: number): boolean {
  const d = (b - a + DAY_MS) % DAY_MS;
  return d > 0 && d < DAY_MS / 2;
}
