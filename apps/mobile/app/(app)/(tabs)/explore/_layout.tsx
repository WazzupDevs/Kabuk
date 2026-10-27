import { Stack } from 'expo-router';
import { useStackOptions } from '@/lib/stackOptions';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'index' };

export default function ExploreLayout() {
  const stackOptions = useStackOptions();
  return <Stack screenOptions={stackOptions} />;
}
