import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

interface LevelBarsProps {
  level: number;
  of: number;
  active: boolean;
}

/** Rising bars that show an activity level at a glance, like a signal meter. */
export function LevelBars({ level, of, active }: LevelBarsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: of }, (_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: 6 + index * 4,
              backgroundColor:
                index < level ? colors[active ? 'brand' : 'textSecondary'] : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 22 },
  bar: { width: 4, borderRadius: radii.pill },
});
