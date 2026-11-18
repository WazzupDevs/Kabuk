const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const sharedPure = path.resolve(monorepoRoot, 'supabase/functions/_shared/pure');

const config = getDefaultConfig(projectRoot);

// Only the dependency-free shared folder is visible to the app.
// `@shared/*` itself is resolved from tsconfig `paths`.
config.watchFolders = [sharedPure];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// The web preview of the visual gate (`pnpm web:onizleme`, scripts/visual/web-shot.ts) only: a
// native package that cannot run in a browser resolves to a stand-in under src/web/. Applies when
// Metro bundles for web; Android and iOS resolve every module as before.
const WEB_STUBS = {
  '@maplibre/maplibre-react-native': path.resolve(projectRoot, 'src/web/maplibre.tsx'),
};
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_STUBS[moduleName] };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
