import { Stack } from 'expo-router';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'consents' };

export default function GroupLayout() {
  // No screen is listed here: a listed screen comes first and the group would open on it, not on
  // its initial route (extras.tsx sets its own options).
  return <Stack screenOptions={{ headerShown: false }} />;
}
