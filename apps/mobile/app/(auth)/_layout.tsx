import { Stack } from 'expo-router';
import { useStackOptions } from '@/lib/stackOptions';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'welcome' };

export default function GroupLayout() {
  const stackOptions = useStackOptions();
  return <Stack screenOptions={stackOptions} />;
}
