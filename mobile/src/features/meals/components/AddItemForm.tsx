import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, TextField } from '@/components/ui';
import { parseNumber } from '@/features/onboarding/validation';
import { spacing } from '@/theme';

import { type EditableItem, manualItem } from '../meal-math';

interface AddItemFormProps {
  onAdd: (item: EditableItem) => void;
  onCancel?: () => void;
}

/** Hand entry: always available, even when the AI or the network is not. */
export function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const kcal = parseNumber(calories);
  const proteinG = protein.trim() ? parseNumber(protein) : 0;
  const errors = {
    name: name.trim() ? null : 'What did you eat?',
    calories: kcal === null || kcal > 3000 ? 'Roughly how many calories? A guess is fine.' : null,
    protein: proteinG === null || proteinG > 300 ? 'Please check the protein.' : null,
  };

  const add = () => {
    setSubmitted(true);
    if (errors.name || errors.calories || errors.protein) return;
    onAdd(manualItem(name, kcal ?? 0, proteinG ?? 0));
    setName('');
    setCalories('');
    setProtein('');
    setSubmitted(false);
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Food"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Masala chai"
        error={submitted ? errors.name : null}
        maxLength={80}
      />
      <View style={styles.row}>
        <TextField
          label="Calories"
          value={calories}
          onChangeText={setCalories}
          suffix="kcal"
          keyboardType="number-pad"
          error={submitted ? errors.calories : null}
          maxLength={4}
        />
        <TextField
          label="Protein (optional)"
          value={protein}
          onChangeText={setProtein}
          suffix="g"
          keyboardType="decimal-pad"
          error={submitted ? errors.protein : null}
          maxLength={5}
        />
      </View>
      <View style={styles.actions}>
        <Button label="Add food" icon="plus" variant="secondary" onPress={add} />
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
});
