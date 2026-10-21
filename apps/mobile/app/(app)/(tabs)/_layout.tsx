import { tabOpenedBy } from '@shared/navigation.ts';
import { Tabs } from 'expo-router';

import { TabBar, TabBarSpace, TabScene } from '@/components/TabBar';
import { useActiveTable } from '@/features/checkin/useActiveTable';
import { useInbox, useRequestCount, useUnreadTotal } from '@/features/friends/queries';
import { tr } from '@/i18n/tr';

export { RouteError as ErrorBoundary } from '@/components/RouteError';

export const unstable_settings = { initialRouteName: 'explore' };

// Keşfet · Aktiviteler · Mekan · Mesajlar · Profil (docs/SPEC_V3.md §18.3). TabBar draws v46's
// bar, each tab's icon from the route name, and blurs the focused screen (each one a TabScene).
// Rooms, check-in, Bildirimler and legal texts are full screen outside the tabs, so the tab bar is
// hidden there; a DM hides it itself.
export default function TabsLayout() {
  const table = useActiveTable();
  useInbox();
  const unread = useUnreadTotal();
  // The bell is in Mesajlar only (K-6): the tab's dot is there for unread DMs and for waiting
  // requests alike.
  const requests = useRequestCount();

  return (
    <TabBarSpace>
      <Tabs
        screenOptions={{ headerShown: false }}
        // Without an active table the Mekan tab opens Keşfet instead.
        tabBar={(props) => (
          <TabBar {...props} opens={(tab) => tabOpenedBy(tab, table.data, Date.now())} />
        )}
        screenLayout={({ navigation, children }) => (
          <TabScene navigation={navigation}>{children}</TabScene>
        )}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="explore"
          options={{ title: tr.tabs.explore, tabBarButtonTestID: 'tab-explore' }}
        />
        <Tabs.Screen
          name="activities"
          options={{ title: tr.tabs.activities, tabBarButtonTestID: 'tab-activities' }}
        />
        <Tabs.Screen
          name="venue"
          options={{
            title: tr.tabs.venue,
            tabBarButtonTestID: 'tab-venue',
            // The Mekan tab (docs/SPEC_V2.md §2) with the mark, drawn by TabBar.
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: tr.tabs.messages,
            tabBarButtonTestID: 'tab-messages',
            tabBarBadge: unread + requests > 0 ? unread + requests : undefined,
            tabBarAccessibilityLabel: tr.tabs.messagesWith(unread, requests),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: tr.tabs.profile, tabBarButtonTestID: 'tab-profile' }}
        />
      </Tabs>
    </TabBarSpace>
  );
}
