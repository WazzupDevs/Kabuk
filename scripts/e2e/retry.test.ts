import { describe, expect, it } from 'vitest';

import {
  type Attempt,
  CRASH_MARGIN_MS,
  driverCrashesInLogcat,
  failedStep,
  retryReason,
} from './retry.ts';

// Lines as Maestro 2.10.0 and the emulator (API 34) write them in CI.
const CRASH =
  'W ActivityManager: Crash of app dev.mobile.maestro running instrumentation ComponentInfo{dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner}';
const listener = 'maestro.cli.runner.CliConsoleListener';
// A flow whose `step` started at `started` and failed at `failed`, inside its flow file.
const maestroLog = (started: string, failed: string, step: string) =>
  [
    `${started} [ INFO] ${listener}.onCommandStart: Run flows/01-login.yaml RUNNING`,
    `${started} [ INFO] ${listener}.onCommandStart: ${step} RUNNING`,
    `${failed} [ INFO] ${listener}.onCommandFinished: ${step} FAILED`,
    `${failed} [ERROR] maestro.orchestra.Orchestra.executeCommands: [Command execution] CommandFailed: x`,
    `${failed} [ INFO] ${listener}.onCommandFinished: Run flows/01-login.yaml FAILED`,
  ].join('\n');
const logcatLine = (time: string, text: string) => `10-19 ${time}   518   547 ${text}`;
const attempt = (a: Partial<Attempt>): Attempt => ({
  maestroLog: '',
  deviceLogcat: '',
  logcat: '',
  console: '',
  report: '',
  ...a,
});

describe('E2E retry: only a test-environment crash', () => {
  it("retries when Maestro's copy of the phone's log has its driver crashing (#151)", () => {
    const reason = retryReason(
      attempt({
        maestroLog: maestroLog('15:07:00.120', '15:07:13.900', 'Tap on id: welcome-start'),
        deviceLogcat:
          '10-18 15:06:58.120 W/ActivityManager(  520): Crash of app dev.mobile.maestro running instrumentation ComponentInfo{dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner}',
      }),
    );
    expect(reason).toMatch(/sürücüsü akış sürerken çöktü/);
    expect(reason).not.toMatch(/\n/);
  });

  it("retries when the job's logcat has the driver crashing well before the failed step started", () => {
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog('15:07:03.500', '15:07:13.900', 'Tap on id: welcome-start'),
          logcat: [
            logcatLine('15:06:58.120', CRASH),
            logcatLine('15:07:14.800', CRASH), // Maestro stopping it
          ].join('\n'),
        }),
      ),
    ).toBe(
      "Maestro'nun telefondaki sürücüsü 15:06:58'da çöktü, düşen adım 15:07:03'da başlamıştı (logcat: `Crash of app dev.mobile.maestro`)",
    );
  });

  it(`wants the crash at least ${CRASH_MARGIN_MS / 1000} s before the failed step started`, () => {
    const run = (crash: string) =>
      retryReason(
        attempt({
          maestroLog: maestroLog('15:07:03.500', '15:07:13.900', 'Tap on id: welcome-start'),
          logcat: logcatLine(crash, CRASH),
        }),
      );
    expect(run('15:06:58.500')).not.toBeNull(); // 5.0 s before
    expect(run('15:06:58.501')).toBeNull();
    expect(run('15:07:00.000')).toBeNull(); // 3.5 s before
    expect(run('15:07:10.000')).toBeNull(); // while the step waited
  });

  it('never retries a failed step whose driver crash is only Maestro stopping it at the end', () => {
    // 19 Oct nightly, large-1 (run 39209259582): the gender step's button below the screen at
    // font_scale 1.3. The step started 06:28:46.375 and failed 06:29:03.730; Maestro's stop wrote
    // the crash line at 06:29:04.611.
    const nightly = maestroLog('06:28:46.375', '06:29:03.730', 'Tap on id: gender-continue');
    expect(
      retryReason(attempt({ maestroLog: nightly, logcat: logcatLine('06:29:04.611', CRASH) })),
    ).toBeNull();
    // The same with the phone's clock half a second behind Maestro's (247d8dc large-4), and more:
    // the line lands before FAILED, still long after the step started.
    expect(
      retryReason(attempt({ maestroLog: nightly, logcat: logcatLine('06:29:03.200', CRASH) })),
    ).toBeNull();
    // #103 (run on 16 Oct): an assertion.
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog(
            '01:48:43.103',
            '01:48:58.423',
            'Assert that "Oda kur" is visible',
          ),
          logcat: logcatLine('01:48:59.300', CRASH),
        }),
      ),
    ).toBeNull();
  });

  it('never retries a failure without any sign of the driver', () => {
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog('10:00:00.000', '10:00:10.000', 'Tap on id: checkin-go'),
        }),
      ),
    ).toBeNull();
    // The emulator or the APK failed before Maestro ran: nothing of Maestro's at all.
    expect(retryReason(attempt({}))).toBeNull();
  });

  it('retries when Maestro cannot reach its driver', () => {
    expect(
      retryReason(
        attempt({
          console:
            'Maestro Android driver did not start up in time  ---  emulator [ emulator-5554 ] & port [ 7001 ]',
        }),
      ),
    ).toMatch(/sürücüsüne ulaşamadı \(`Maestro Android driver did not start up in time`\)/);
    expect(
      retryReason(
        attempt({
          maestroLog: `${maestroLog('10:00:00.000', '10:00:10.000', 'Tap on id: x')}\nio.grpc.StatusRuntimeException: UNAVAILABLE: io exception`,
        }),
      ),
    ).toMatch(/StatusRuntimeException: UNAVAILABLE/);
    // #164's test run (5b07df55, light-2): in report.xml alone; Maestro printed "Flow Failed".
    expect(
      retryReason(
        attempt({
          report:
            "<failure>maestro.android.DeviceServerDiedException: Device server died during 'viewHierarchy' on emulator-5554 (469ms since last byte, connection age 84332ms): StatusRuntimeException: UNAVAILABLE</failure>",
          console: '[Failed] P0 kritik yol, parça 2 (1m 23s)\n\n1/1 Flow Failed',
        }),
      ),
    ).toMatch(/sürücüsüne ulaşamadı \(`DeviceServerDiedException`\)/);
  });

  it('compares the clocks across midnight', () => {
    const run = (crash: string, started: string) =>
      retryReason(
        attempt({
          maestroLog: maestroLog(started, '00:00:20.000', 'Tap on id: x'),
          logcat: logcatLine(crash, CRASH),
        }),
      );
    expect(run('23:59:58.000', '00:00:05.000')).not.toBeNull();
    expect(run('00:00:01.000', '23:59:58.000')).toBeNull();
  });

  it('reads the failed step (not the flows around it) and when it last started', () => {
    expect(
      failedStep(maestroLog('06:28:46.375', '06:29:03.730', 'Tap on id: gender-continue')),
    ).toEqual({
      started: { time: '06:28:46', ms: (6 * 3600 + 28 * 60 + 46) * 1000 + 375 },
      failed: { time: '06:29:03', ms: (6 * 3600 + 29 * 60 + 3) * 1000 + 730 },
    });
    // The same step ran before and passed: its last start counts.
    const again = [
      `10:00:00.000 [ INFO] ${listener}.onCommandStart: Tap on id: x RUNNING`,
      `10:00:01.000 [ INFO] ${listener}.onCommandFinished: Tap on id: x COMPLETED`,
      `10:00:30.000 [ INFO] ${listener}.onCommandStart: Tap on id: x RUNNING`,
      `10:00:40.000 [ INFO] ${listener}.onCommandFinished: Tap on id: x FAILED`,
    ].join('\n');
    expect(failedStep(again)?.started.time).toBe('10:00:30');
    expect(
      failedStep(`12:00:00.000 [ INFO] ${listener}.onCommandFinished: Tap COMPLETED`),
    ).toBeNull();
    expect(
      driverCrashesInLogcat(
        [logcatLine('12:23:00.516', CRASH), logcatLine('12:23:01.000', 'W Other: x')].join('\n'),
      ).map((c) => c.time),
    ).toEqual(['12:23:00']);
  });
});
