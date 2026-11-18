// pnpm web:onizleme [-- --port <n>] [--clear]
// The web preview server for scripts/visual/web-shot.ts: Metro bundles apps/mobile for the browser
// (expo start --web) and rebuilds what changes. Web is a platform only under SKALL_WEB_ONIZLEME=1
// (app.config.ts, tailwind.config.js, metro.config.js → WEB_STUBS; the root is app/_layout.web.tsx),
// so nothing here reaches an Android or iOS build. The Supabase address is a closed local port and
// the key a placeholder: the gate's screens draw from their own data and never call the server;
// no Sentry or PostHog key, so neither starts.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = join(dirname(fileURLToPath(import.meta.url)), '../../apps/mobile');
const extra = process.argv.slice(2);
const port = extra.includes('--port') ? [] : ['--port', '8081'];
const child = spawn('npx', ['expo', 'start', '--web', ...port, ...extra], {
  cwd: mobile,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    SKALL_WEB_ONIZLEME: '1',
    // app.json lists no web platform; the Expo CLI's own web check reads only app.json.
    EXPO_NO_WEB_SETUP: '1',
    // No browser window. Not CI=1: under it Metro does not watch, and a change would need a
    // restart.
    BROWSER: 'none',
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'web-onizleme',
    EXPO_PUBLIC_SENTRY_DSN: '',
    EXPO_PUBLIC_POSTHOG_KEY: '',
    // designPickerEnabled (ThemeProvider.tsx): the gate's route opens.
    EXPO_PUBLIC_APP_ENV: 'e2e',
  },
});
child.on('exit', (code) => process.exit(code ?? 0));
