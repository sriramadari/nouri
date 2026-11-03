import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark, Button, Icon, type IconName, Text } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, radii, spacing } from '@/theme';

import { stepHref } from './steps';

const PROMISES: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'camera', title: 'Snap or speak a meal', detail: 'No searching, no weighing.' },
  { icon: 'sparkles', title: 'Katori does the maths', detail: 'Calories, protein, portions.' },
  { icon: 'leaf', title: 'One next step, with the why', detail: 'Tied to your goal and labs.' },
];

/**
 * First impression: who the assistant is and what it will do for you, in three lines, then
 * one button. Entrance motion is skipped automatically when the person prefers reduced motion.
 */
export function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.main}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
            <View style={styles.bowl}>
              <BrandMark size={84} />
            </View>
            <Text variant="display" align="center" accessibilityRole="header">
              Katori
            </Text>
            <Text variant="heading" color="brandText" align="center">
              Eat well, know why.
            </Text>
          </Animated.View>

          <View style={styles.promises}>
            {PROMISES.map((promise, index) => (
              <Animated.View
                key={promise.title}
                entering={FadeInDown.delay(250 + index * 120).duration(500)}
                style={styles.promise}
              >
                <View style={styles.promiseIcon}>
                  <Icon name={promise.icon} size={20} />
                </View>
                <View style={styles.promiseText}>
                  <Text variant="bodyStrong">{promise.title}</Text>
                  <Text variant="caption" color="textSecondary">
                    {promise.detail}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(650).duration(500)} style={styles.footer}>
          <Button label="Let’s begin" onPress={() => router.push(stepHref('name'))} fullWidth />
          <Text variant="caption" color="textMuted" align="center">
            About a minute. No sign up, your data stays tied to this device.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  main: { flex: 1, justifyContent: 'center', gap: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.xs },
  bowl: {
    width: 148,
    height: 148,
    borderRadius: radii.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  promises: { gap: spacing.lg },
  promise: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  promiseIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseText: { flex: 1 },
  footer: { gap: spacing.md },
});
