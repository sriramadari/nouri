import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouri</Text>
      <Text style={styles.tagline}>Eat smart, feel better.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
