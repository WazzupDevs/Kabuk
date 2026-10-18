import { Stack } from 'expo-router';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'consents' };

export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The last step: no swipe back into the sent profile (extras.tsx blocks Android's back). */}
      <Stack.Screen name="extras" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
