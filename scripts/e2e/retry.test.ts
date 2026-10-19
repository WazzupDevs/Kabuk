import { describe, expect, it } from 'vitest';

import { type Attempt, driverCrashesInLogcat, firstFailure, retryReason } from './retry.ts';

// Lines as Maestro 2.10.0 and the emulator (API 34) write them in CI.
const CRASH =
  'W ActivityManager: Crash of app dev.mobile.maestro running instrumentation ComponentInfo{dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner}';
const maestroLog = (failedAt: string, step: string) =>
  [
    `${failedAt.slice(0, 8)}.000 [ INFO] maestro.cli.runner.CliConsoleListener.onCommandStart: ${step} RUNNING`,
    `${failedAt} [ INFO] maestro.cli.runner.CliConsoleListener.onCommandFinished: ${step} FAILED`,
    `${failedAt} [ERROR] maestro.orchestra.Orchestra.executeCommands: [Command execution] CommandFailed: x`,
    `${failedAt} [ INFO] maestro.cli.runner.CliConsoleListener.onCommandFinished: Run flows/01-login.yaml FAILED`,
  ].join('\n');
const logcatLine = (time: string, text: string) => `10-18 ${time}   520   548 ${text}`;
const attempt = (a: Partial<Attempt>): Attempt => ({
  maestroLog: '',
  deviceLogcat: '',
  logcat: '',
  console: '',
  ...a,
});

describe('E2E retry: only a test-environment crash', () => {
  it("retries when Maestro's copy of the phone's log has its driver crashing (#151)", () => {
    const reason = retryReason(
      attempt({
        maestroLog: maestroLog('15:07:13.900', 'Tap on id: welcome-start'),
        deviceLogcat:
          '10-18 15:06:58.120 W/ActivityManager(  520): Crash of app dev.mobile.maestro running instrumentation ComponentInfo{dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner}',
      }),
    );
    expect(reason).toMatch(/sürücüsü akış sürerken çöktü/);
    expect(reason).not.toMatch(/\n/);
  });

  it("retries when the job's logcat has the driver crashing before the failed step", () => {
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog('15:07:13.900', 'Tap on id: welcome-start'),
          logcat: [
            logcatLine('15:06:58.120', CRASH),
            logcatLine('15:07:16.700', CRASH), // Maestro stopping it
          ].join('\n'),
        }),
      ),
    ).toBe(
      "Maestro'nun telefondaki sürücüsü 15:06:58'da çöktü, akış 15:07:13'da düştü (logcat: `Crash of app dev.mobile.maestro`)",
    );
  });

  it('never retries a failed step whose driver crash is only Maestro stopping it at the end', () => {
    // 19 Oct nightly, large-1: the gender step's button below the screen at font_scale 1.3.
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog('06:29:04.640', 'Tap on id: gender-continue'),
          logcat: logcatLine('06:29:05.120', CRASH),
          deviceLogcat:
            '10-19 06:29:04.700 I/ActivityManager(  520): Force stopping app.kabuk.mobile',
        }),
      ),
    ).toBeNull();
    // #103: an assertion.
    expect(
      retryReason(
        attempt({
          maestroLog: maestroLog('01:48:58.423', 'Assert that "Oda kur" is visible'),
          logcat: logcatLine('01:49:01.000', CRASH),
        }),
      ),
    ).toBeNull();
  });

  it('never retries a failure without any sign of the driver', () => {
    expect(
      retryReason(attempt({ maestroLog: maestroLog('10:00:00.000', 'Tap on id: checkin-go') })),
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
          maestroLog: `${maestroLog('10:00:00.000', 'Tap on id: x')}\nio.grpc.StatusRuntimeException: UNAVAILABLE: io exception`,
        }),
      ),
    ).toMatch(/StatusRuntimeException: UNAVAILABLE/);
  });

  it('compares the clocks across midnight', () => {
    const run = (crash: string, failed: string) =>
      retryReason(
        attempt({
          maestroLog: maestroLog(failed, 'Tap on id: x'),
          logcat: logcatLine(crash, CRASH),
        }),
      );
    expect(run('23:59:58.000', '00:00:05.000')).not.toBeNull();
    expect(run('00:00:01.000', '23:59:58.000')).toBeNull();
  });

  it('reads the first failed step and every driver crash with its time', () => {
    expect(firstFailure(maestroLog('12:22:57.543', 'Tap on id: x'))).toEqual({
      time: '12:22:57',
      ms: (12 * 3600 + 22 * 60 + 57) * 1000 + 543,
    });
    expect(firstFailure('12:00:00.000 [ INFO] …onCommandFinished: Tap COMPLETED')).toBeNull();
    expect(
      driverCrashesInLogcat(
        [logcatLine('12:23:00.516', CRASH), logcatLine('12:23:01.000', 'W Other: x')].join('\n'),
      ).map((c) => c.time),
    ).toEqual(['12:23:00']);
  });
});
