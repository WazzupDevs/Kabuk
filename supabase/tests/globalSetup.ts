// Pauses every pg_cron job while the integration tests run, so no job fires between two steps of
// a test (a closed reveal window, a refreshed Keşfet bucket, an expired request). Tests that cover
// a job call its function directly. Teardown turns every job back on but the one the migrations
// create switched off (sprengja-explode, K-85 O-14: turned on by hand); a run killed before
// teardown is healed by the next run's teardown or by `pnpm db:reset`.
import { sql } from './local.ts';

// Created off, and left off by the tests.
const OFF_BY_DEFAULT = ['sprengja-explode'];

export async function setup(): Promise<void> {
  await sql`select cron.alter_job(jobid, active => false) from cron.job`;
  // A job that started just before the pause may still be running; wait for it to finish.
  for (let i = 0; i < 50; i++) {
    const [running] = await sql`
      select count(*)::int as n from cron.job_run_details
      where status in ('starting', 'running') and start_time > now() - interval '1 minute'
    `;
    if (running?.n === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('a pg_cron job is still running after 10 s');
}

export async function teardown(): Promise<void> {
  await sql`
    select cron.alter_job(jobid, active => true) from cron.job
    where not (jobname = any (${OFF_BY_DEFAULT}))
  `;
  await sql.end();
}
