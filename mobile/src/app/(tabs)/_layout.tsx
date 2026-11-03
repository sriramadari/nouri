import { Tabs } from 'expo-router/tabs';

import { AppTabBar, type TabItem } from '@/components/navigation/AppTabBar';
import { colors } from '@/theme';

/** Today, a raised centre button to log a meal, and long term health (lab reports). */
const TAB_ITEMS: Record<string, TabItem> = {
  index: { label: 'Today', icon: 'today' },
  log: { label: 'Log meal', icon: 'plus', raised: true },
  health: { label: 'Health', icon: 'health' },
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} items={TAB_ITEMS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log a meal', tabBarAccessibilityLabel: 'Log a meal' }}
      />
      <Tabs.Screen name="health" options={{ title: 'Health' }} />
    </Tabs>
  );
}
