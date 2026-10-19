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
// - in the job's own logcat, earlier than the step that failed (maestro.log's first FAILED).
// A driver Maestro cannot reach shows in what Maestro prints or logs.

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
};

const DRIVER_CRASH = /Crash of app dev\.mobile\.maestro\b/;
// Maestro could not reach its driver: it did not start, or the connection to it is gone (gRPC
// UNAVAILABLE: the driver's port answers no more).
const UNREACHABLE = [
  /Maestro Android driver did not start up in time/,
  /StatusRuntimeException: UNAVAILABLE/,
];
const DAY_MS = 24 * 60 * 60 * 1000;

// Why the attempt is run once more (one line, for the job summary), or null.
export function retryReason(a: Attempt): string | null {
  if (DRIVER_CRASH.test(a.deviceLogcat)) {
    return "Maestro'nun telefondaki sürücüsü akış sürerken çöktü (Maestro'nun cihaz logunda `Crash of app dev.mobile.maestro`)";
  }
  const failedAt = firstFailure(a.maestroLog);
  if (failedAt) {
    const crash = driverCrashesInLogcat(a.logcat).find((at) => before(at.ms, failedAt.ms));
    if (crash) {
      return `Maestro'nun telefondaki sürücüsü ${crash.time}'da çöktü, akış ${failedAt.time}'da düştü (logcat: \`Crash of app dev.mobile.maestro\`)`;
    }
  }
  for (const text of [a.console, a.maestroLog]) {
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

// The first step that failed: maestro.log's "HH:MM:SS.mmm [ INFO] …onCommandFinished: … FAILED".
export function firstFailure(maestroLog: string): At | null {
  const m = /^(\d\d:\d\d:\d\d\.\d{3}) .*onCommandFinished: .* FAILED$/m.exec(maestroLog);
  return m?.[1] ? at(m[1]) : null;
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
