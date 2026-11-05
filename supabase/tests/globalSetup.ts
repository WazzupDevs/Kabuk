// Pauses every pg_cron job while the integration tests run, so no job fires between two steps of
// a test (a closed reveal window, a refreshed Keşfet bucket, an expired request). Tests that cover
// a job call its function directly. Teardown turns back on the jobs that were on before the run;
// one the migrations create switched off (sprengja-explode, K-85 O-14) stays off. A run killed
// before teardown is healed by `pnpm db:reset`.
import { sql } from './local.ts';

// The jobs that were on when the run started.
let wereActive: number[] = [];

export async function setup(): Promise<void> {
  const rows = await sql`select jobid from cron.job where active`;
  wereActive = rows.map((r) => Number(r.jobid));
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
  await sql`select cron.alter_job(jobid, active => true) from cron.job where jobid = any (${wereActive})`;
  await sql.end();
}
