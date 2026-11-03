import { type BottomTabBarButtonProps, Tabs } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { colors, radii, typography } from '@/theme';

function tabIcon(name: IconName) {
  function TabIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} color={focused ? 'primary' : 'textMuted'} />;
  }
  return TabIcon;
}

const LOG_BUTTON_SIZE = 60;

/**
 * The raised turmeric button in the middle of the tab bar. Logging is the one thing people do
 * several times a day, so it sits under the thumb on every main screen.
 */
function LogTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <View style={styles.logSlot}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Log a meal"
        accessibilityState={accessibilityState}
        style={({ pressed }) => [styles.logButton, pressed && styles.logButtonPressed]}
      >
        <Icon name="plus" size={30} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

/** Today, a centre button to log a meal, and long term health (lab reports). */
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
      <Tabs.Screen
        name="log"
        options={{ title: 'Log a meal', tabBarButton: (props) => <LogTabButton {...props} /> }}
      />
      <Tabs.Screen name="health" options={{ title: 'Health', tabBarIcon: tabIcon('health') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logSlot: { flex: 1, alignItems: 'center' },
  logButton: {
    width: LOG_BUTTON_SIZE,
    height: LOG_BUTTON_SIZE,
    // Lifts the button half out of the bar; the paper coloured ring separates it from the bar.
    marginTop: -LOG_BUTTON_SIZE / 3,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonPressed: { backgroundColor: colors.brandText },
});
