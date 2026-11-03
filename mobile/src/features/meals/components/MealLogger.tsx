import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AdaptiveSheet, Button, ErrorState, Icon, Text, useToast } from '@/components/ui';
import { ApiError, toApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import { buildUploadForm, type PickedFile } from '@/lib/api/upload';
import { haptics } from '@/lib/haptics';
import { colors, radii, spacing } from '@/theme';

import { capturePhoto } from '@/lib/media/capture-photo';
import {
  type EditableMeal,
  emptyManualMeal,
  fromDraft,
  mealTotals,
  toCreateMealInput,
} from '../meal-math';
import { saveMeal } from '../meal-sync';
import { useVoiceRecorder, type VoiceResult } from '../use-voice-recorder';
import { AnalyzingPanel } from './AnalyzingPanel';
import { MealReview } from './MealReview';
import { RecordingPanel } from './RecordingPanel';

type Capture = 'PHOTO' | 'VOICE';

/** Every state of logging a meal. Exactly one is active, so impossible mixes cannot happen. */
type Flow =
  | { step: 'closed' }
  | { step: 'recording' }
  | { step: 'analyzing'; source: Capture; file: PickedFile }
  | { step: 'failed'; source: Capture; error: ApiError; file?: PickedFile }
  | { step: 'denied'; what: 'camera' | 'microphone' }
  | { step: 'review'; meal: EditableMeal };

const SHEET_TITLES: Record<Flow['step'], string> = {
  closed: '',
  recording: 'Listening…',
  analyzing: 'One moment',
  failed: 'Let’s try that again',
  denied: 'Permission needed',
  review: 'Check your meal',
};

const VOICE_PROBLEMS: Record<Exclude<VoiceResult['status'], 'recorded'>, string> = {
  'too-short': 'That was very short. Hold on a second longer and say what you ate.',
  silent: 'Katori didn’t hear anything. Check your mic and try again, a little closer.',
};

/**
 * The hero flow: Snap or Speak, the AI drafts the meal, the person checks it, Save. Every
 * failure has a way forward (retry, retake, add by hand), and saving works offline.
 */
export function MealLogger({ onSaved }: { onSaved?: () => void }) {
  const [flow, setFlow] = useState<Flow>({ step: 'closed' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const voice = useVoiceRecorder();
  const showToast = useToast((state) => state.show);
  // Each analysis gets an id; a result that arrives after the person moved on is ignored.
  const attempt = useRef(0);

  const close = () => {
    attempt.current += 1;
    if (flow.step === 'recording') voice.cancel().catch(() => undefined);
    setSaveError(null);
    setFlow({ step: 'closed' });
  };

  const analyze = async (source: Capture, file: PickedFile) => {
    const id = ++attempt.current;
    setFlow({ step: 'analyzing', source, file });
    try {
      const draft = await api.analyzeMeal(await buildUploadForm(file));
      if (id !== attempt.current) return;
      haptics.success();
      setFlow({ step: 'review', meal: fromDraft(draft) });
    } catch (error) {
      if (id !== attempt.current) return;
      haptics.warning();
      setFlow({ step: 'failed', source, error: toApiError(error), file });
    }
  };

  const snap = async (from: 'camera' | 'library') => {
    const result = await capturePhoto(from, 'meal.jpg');
    if (result.status === 'denied') setFlow({ step: 'denied', what: 'camera' });
    if (result.status === 'picked') await analyze('PHOTO', result.file);
  };

  const speak = async () => {
    haptics.tap();
    setFlow({ step: 'recording' });
    if ((await voice.start()) === 'denied') setFlow({ step: 'denied', what: 'microphone' });
  };

  const stopping = useRef(false);
  const stopRecording = async () => {
    if (stopping.current) return; // Done tapped twice, or the time limit hit at the same moment
    stopping.current = true;
    const result = await voice.stop().finally(() => {
      stopping.current = false;
    });
    if (result.status === 'recorded') {
      await analyze('VOICE', result.file);
    } else {
      setFlow({
        step: 'failed',
        source: 'VOICE',
        error: new ApiError(0, 'VOICE_NOT_UNDERSTOOD', VOICE_PROBLEMS[result.status]),
      });
    }
  };

  const addByHand = () => setFlow({ step: 'review', meal: emptyManualMeal() });

  const save = async (meal: EditableMeal) => {
    if (saving) return; // second tap while saving
    setSaving(true);
    setSaveError(null);
    try {
      const where = await saveMeal(toCreateMealInput(meal));
      haptics.success();
      const calories = mealTotals(meal).calories;
      showToast(
        where === 'saved'
          ? `Meal saved · ${calories} kcal`
          : 'Saved on your phone. Katori will sync it when you’re online.',
        where === 'saved' ? 'success' : 'offline',
      );
      setFlow({ step: 'closed' });
      onSaved?.();
    } catch (error) {
      setSaveError(toApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.capture}>
      {/* Snap is the hero: a photo gives the most accurate estimate for the least effort. */}
      <View style={styles.halo}>
        <Pressable
          onPress={() => snap('camera')}
          accessibilityRole="button"
          accessibilityLabel="Snap"
          accessibilityHint="Opens the camera to photograph your meal"
          style={({ pressed }) => [styles.snap, pressed && styles.snapPressed]}
        >
          <Icon name="camera" size={44} strokeWidth={1.8} />
          <Text variant="heading">Snap</Text>
        </Pressable>
      </View>
      <Text variant="caption" color="textSecondary" align="center">
        A photo of your plate, from above
      </Text>

      <View style={styles.or}>
        <View style={styles.rule} />
        <Text variant="eyebrow" color="textMuted">
          or
        </Text>
        <View style={styles.rule} />
      </View>

      <Button label="Speak" icon="mic" onPress={speak} fullWidth />
      <View style={styles.extras}>
        <View style={styles.extra}>
          <Button
            label="From gallery"
            icon="image"
            variant="secondary"
            onPress={() => snap('library')}
            fullWidth
          />
        </View>
        <View style={styles.extra}>
          <Button
            label="Type it in"
            icon="edit"
            variant="secondary"
            onPress={addByHand}
            fullWidth
          />
        </View>
      </View>

      <AdaptiveSheet
        visible={flow.step !== 'closed'}
        onClose={close}
        title={SHEET_TITLES[flow.step]}
        footer={
          flow.step === 'review' ? (
            <Button
              label={
                flow.meal.items.length === 0
                  ? 'Add a food to save'
                  : `Save meal · ${mealTotals(flow.meal).calories} kcal`
              }
              icon="check"
              loading={saving}
              disabled={flow.meal.items.length === 0}
              onPress={() => save(flow.meal)}
              fullWidth
            />
          ) : undefined
        }
      >
        {flow.step === 'recording' ? (
          <RecordingPanel
            durationMillis={voice.durationMillis}
            onStop={stopRecording}
            onCancel={close}
          />
        ) : null}
        {flow.step === 'analyzing' ? <AnalyzingPanel source={flow.source} /> : null}
        {flow.step === 'review' ? (
          <MealReview
            meal={flow.meal}
            onChange={(meal) => setFlow({ step: 'review', meal })}
            saveError={saveError}
          />
        ) : null}
        {flow.step === 'failed' ? (
          <FailedPanel
            flow={flow}
            onRetry={() => flow.file && analyze(flow.source, flow.file)}
            onRedo={() => (flow.source === 'PHOTO' ? snap('camera') : speak())}
            onAddByHand={addByHand}
          />
        ) : null}
        {flow.step === 'denied' ? (
          <View style={styles.panel}>
            <ErrorState
              title={flow.what === 'camera' ? 'Camera access is off' : 'Microphone access is off'}
              message={
                flow.what === 'camera'
                  ? 'Turn it on in Settings to snap meals, or pick a photo you already took.'
                  : 'Turn it on in Settings to speak your meals, or add this one by hand.'
              }
            />
            <Button
              label="Open Settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
              fullWidth
            />
            {flow.what === 'camera' ? (
              <Button
                label="Choose a photo"
                variant="ghost"
                onPress={() => snap('library')}
                fullWidth
              />
            ) : null}
            <Button label="Add by hand" variant="ghost" onPress={addByHand} fullWidth />
          </View>
        ) : null}
      </AdaptiveSheet>
    </View>
  );
}

const FAILURE_TITLES: Record<string, string> = {
  MEAL_NOT_RECOGNIZED: 'Couldn’t see the food',
  VOICE_NOT_UNDERSTOOD: 'Didn’t catch that',
  AI_TIMEOUT: 'That took too long',
  AI_UNAVAILABLE: 'Katori is busy',
};

function FailedPanel({
  flow,
  onRetry,
  onRedo,
  onAddByHand,
}: {
  flow: Extract<Flow, { step: 'failed' }>;
  onRetry: () => void;
  onRedo: () => void;
  onAddByHand: () => void;
}) {
  const { error, source, file } = flow;
  // Timeouts and busy servers deserve a retry with the same photo; a blurry photo does not.
  const canRetrySame = Boolean(file) && error.isRetryable && !error.isConnectionProblem;
  const offline = error.code === 'NETWORK_ERROR';

  return (
    <View style={styles.panel}>
      <ErrorState
        title={offline ? 'You’re offline' : (FAILURE_TITLES[error.code] ?? 'That didn’t work')}
        offline={offline}
        message={
          offline
            ? 'Katori needs the internet to read a meal. Add it by hand now and it will sync later.'
            : error.message
        }
      />
      {canRetrySame ? (
        <Button label="Try again" icon="refresh" onPress={onRetry} fullWidth />
      ) : null}
      {!offline ? (
        <Button
          label={source === 'PHOTO' ? 'Retake photo' : 'Record again'}
          icon={source === 'PHOTO' ? 'camera' : 'mic'}
          variant={canRetrySame ? 'secondary' : 'primary'}
          onPress={onRedo}
          fullWidth
        />
      ) : null}
      <Button
        label="Add by hand"
        icon="edit"
        variant={offline ? 'primary' : 'ghost'}
        onPress={onAddByHand}
        fullWidth
      />
    </View>
  );
}

const SNAP_SIZE = 168;

const styles = StyleSheet.create({
  capture: { alignItems: 'center', gap: spacing.md },
  halo: {
    width: SNAP_SIZE + 28,
    height: SNAP_SIZE + 28,
    borderRadius: radii.pill,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snap: {
    width: SNAP_SIZE,
    height: SNAP_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  snapPressed: { backgroundColor: colors.brandText, transform: [{ scale: 0.97 }] },
  or: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  extras: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  extra: { flex: 1 },
  panel: { gap: spacing.md },
});
