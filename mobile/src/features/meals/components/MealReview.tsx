import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button, Card, Chip, Icon, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { colors, MIN_TAP_TARGET, radii, spacing } from '@/theme';

import {
  type EditableItem,
  type EditableMeal,
  itemNutrition,
  mealTotals,
  portionLabel,
  stepPortion,
} from '../meal-math';
import { AddItemForm } from './AddItemForm';

interface MealReviewProps {
  meal: EditableMeal;
  onChange: (meal: EditableMeal) => void;
  saveError: string | null;
}

/** The confirm step: editable food chips, live totals, and hand entry as a fallback. */
export function MealReview({ meal, onChange, saveError }: MealReviewProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(meal.items.length === 0);
  const selected = meal.items.find((item) => item.key === selectedKey);
  const totals = mealTotals(meal);
  const anyToReview = meal.items.some((item) => item.needsReview);

  const updateItem = (key: string, changes: Partial<EditableItem>) =>
    onChange({
      ...meal,
      items: meal.items.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    });

  const removeItem = (key: string) => {
    haptics.tap();
    if (selectedKey === key) setSelectedKey(null);
    onChange({ ...meal, items: meal.items.filter((item) => item.key !== key) });
  };

  return (
    <View style={styles.container}>
      {meal.transcript ? (
        <Text color="textSecondary">
          Heard: <Text variant="bodyStrong">“{meal.transcript}”</Text>
        </Text>
      ) : null}
      {anyToReview ? (
        <Text variant="caption" color="warning">
          Katori isn’t sure about the highlighted items. Tap one to check it.
        </Text>
      ) : null}

      <View style={styles.chips}>
        {meal.items.map((item) => (
          <Animated.View
            key={item.key}
            entering={FadeIn}
            exiting={FadeOut}
            layout={LinearTransition}
          >
            <Chip
              label={item.name}
              detail={`${portionLabel(item)} · ${itemNutrition(item).calories} kcal`}
              needsReview={item.needsReview}
              onPress={() => setSelectedKey(selectedKey === item.key ? null : item.key)}
              onRemove={() => removeItem(item.key)}
            />
          </Animated.View>
        ))}
      </View>

      {selected ? (
        <ItemEditor
          item={selected}
          onScale={(direction) =>
            updateItem(selected.key, {
              scale: stepPortion(selected.scale, direction),
              needsReview: false,
            })
          }
          onConfirm={() => {
            updateItem(selected.key, { needsReview: false });
            setSelectedKey(null);
          }}
        />
      ) : null}

      {adding ? (
        <AddItemForm
          onAdd={(item) => {
            onChange({ ...meal, items: [...meal.items, item] });
            setAdding(false);
          }}
          onCancel={meal.items.length > 0 ? () => setAdding(false) : undefined}
        />
      ) : (
        <Button label="Add a food" icon="plus" variant="ghost" onPress={() => setAdding(true)} />
      )}

      <Card tone="primaryTint" style={styles.totals} accessible>
        <Total label="Calories" value={`${totals.calories}`} unit="kcal" />
        <Total label="Protein" value={`${Math.round(totals.proteinG)}`} unit="g" />
        <Total label="Carbs" value={`${Math.round(totals.carbsG)}`} unit="g" />
        <Total label="Fat" value={`${Math.round(totals.fatG)}`} unit="g" />
      </Card>

      {saveError ? (
        <Text color="danger" accessibilityRole="alert">
          {saveError}
        </Text>
      ) : null}
    </View>
  );
}

function ItemEditor({
  item,
  onScale,
  onConfirm,
}: {
  item: EditableItem;
  onScale: (direction: -1 | 1) => void;
  onConfirm: () => void;
}) {
  return (
    <Card style={styles.editor}>
      <Text variant="bodyStrong">{item.name}</Text>
      <View style={styles.stepper}>
        <StepButton
          icon="minus"
          label={`Smaller portion of ${item.name}`}
          onPress={() => onScale(-1)}
        />
        <View style={styles.stepperValue}>
          <Text variant="bodyStrong" align="center">
            {portionLabel(item)}
          </Text>
          <Text variant="caption" color="textSecondary" align="center">
            {itemNutrition(item).calories} kcal · {itemNutrition(item).proteinG} g protein
          </Text>
        </View>
        <StepButton
          icon="plus"
          label={`Bigger portion of ${item.name}`}
          onPress={() => onScale(1)}
        />
      </View>
      {item.needsReview ? (
        <Button label="Looks right" icon="check" variant="secondary" onPress={onConfirm} />
      ) : null}
    </Card>
  );
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: 'minus' | 'plus';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
    >
      <Icon name={icon} color="primary" />
    </Pressable>
  );
}

function Total({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.total} accessibilityLabel={`${label} ${value} ${unit}`}>
      <Text variant="heading">
        {value}
        <Text variant="caption" color="textSecondary">
          {' '}
          {unit}
        </Text>
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  editor: { gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperValue: { flex: 1, gap: spacing.xxs },
  stepButton: {
    width: MIN_TAP_TARGET,
    height: MIN_TAP_TARGET,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: colors.surfaceMuted },
  totals: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { alignItems: 'center', gap: spacing.xxs },
});
