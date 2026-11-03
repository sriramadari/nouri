import type { BottomTabBarProps } from 'expo-router/tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { colors, MAX_CONTENT_WIDTH, radii, spacing } from '@/theme';

export interface TabItem {
  label: string;
  icon: IconName;
  /** The raised centre action (logging a meal) instead of a normal tab. */
  raised?: boolean;
}

interface AppTabBarProps extends BottomTabBarProps {
  /** Label and icon per route name, in the same order as the screens. */
  items: Record<string, TabItem>;
}

const RAISED_SIZE = 58;
// A fixed height for every item, so labels can never be clipped by the bar.
const ITEM_HEIGHT = 56;

/**
 * Katori's own tab bar. The default one sized itself from the icon and cut off labels on some
 * screens; this one has a fixed item height, a soft turmeric pill behind the active icon, and
 * the raised turmeric button for logging in the middle, with its own label.
 */
export function AppTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  items,
}: AppTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.row} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const item = items[route.name];
          if (!item) return null;
          const focused = index === state.index;
          const label = descriptors[route.key]?.options.tabBarAccessibilityLabel ?? item.label;

          const onPress = () => {
            if (item.raised) haptics.tap();
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={styles.item}
            >
              {({ pressed }) =>
                item.raised ? (
                  <>
                    <View style={[styles.raised, pressed && styles.raisedPressed]}>
                      <Icon name={item.icon} size={28} strokeWidth={2.5} />
                    </View>
                    <Text
                      variant="label"
                      color={focused ? 'textPrimary' : 'textSecondary'}
                      style={styles.label}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.iconPill,
                        focused && styles.iconPillActive,
                        pressed && styles.iconPillPressed,
                      ]}
                    >
                      <Icon
                        name={item.icon}
                        size={22}
                        color={focused ? 'textPrimary' : 'textMuted'}
                        strokeWidth={focused ? 2.2 : 1.8}
                      />
                    </View>
                    <Text
                      variant="label"
                      color={focused ? 'textPrimary' : 'textMuted'}
                      style={styles.label}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </>
                )
              }
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    ...Platform.select({
      android: { elevation: 8 },
      default: {
        shadowColor: colors.brandText,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  // Kept to the content width on tablets and desktop, so the three items stay together.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  iconPill: {
    width: 60,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: colors.brandTint },
  iconPillPressed: { backgroundColor: colors.surfaceMuted },
  label: { fontSize: 12, lineHeight: 16 },
  raised: {
    width: RAISED_SIZE,
    height: RAISED_SIZE,
    // Lifts the button above the bar; the paper coloured ring separates it from the content.
    marginTop: -RAISED_SIZE / 2,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      default: {
        shadowColor: colors.brandText,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  raisedPressed: { backgroundColor: colors.brandText, transform: [{ scale: 0.96 }] },
});
