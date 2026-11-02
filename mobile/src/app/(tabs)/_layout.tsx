import { Tabs } from 'expo-router/tabs';

import { Icon, type IconName } from '@/components/ui';
import { colors, typography } from '@/theme';

function tabIcon(name: IconName) {
  function TabIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} color={focused ? 'primary' : 'textMuted'} />;
  }
  return TabIcon;
}

/** Two destinations only: today's progress and long term health (lab reports). */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: typography.label.fontSize, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: tabIcon('today') }} />
      <Tabs.Screen name="health" options={{ title: 'Health', tabBarIcon: tabIcon('health') }} />
    </Tabs>
  );
}
