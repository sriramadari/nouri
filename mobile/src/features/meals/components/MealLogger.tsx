import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  AdaptiveSheet,
  Button,
  ErrorState,
  Icon,
  type IconName,
  Text,
  useToast,
} from '@/components/ui';
import { ApiError, toApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import { buildUploadForm, type PickedFile } from '@/lib/api/upload';
import { haptics } from '@/lib/haptics';
import { colors, MIN_TAP_TARGET, radii, spacing } from '@/theme';

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
export function MealLogger() {
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
    } catch (error) {
      setSaveError(toApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.dock}>
      <View>
        <Text variant="heading" color="textOnPrimary">
          What did you eat?
        </Text>
        <Text variant="caption" color="textOnPrimaryMuted">
          Snap the plate or say it. Katori does the counting.
        </Text>
      </View>
      <View style={styles.primary}>
        <View style={styles.action}>
          <Button
            label="Snap"
            icon="camera"
            variant="brand"
            onPress={() => snap('camera')}
            fullWidth
          />
        </View>
        <View style={styles.action}>
          <Button label="Speak" icon="mic" variant="secondary" onPress={speak} fullWidth />
        </View>
      </View>
      <View style={styles.secondary}>
        <QuickAction icon="image" label="From gallery" onPress={() => snap('library')} />
        <View style={styles.divider} />
        <QuickAction icon="edit" label="Type it in" onPress={addByHand} />
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

/** A quiet text action on the dark dock, for the less common ways to log. */
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color="textOnPrimaryMuted" />
      <Text variant="label" color="textOnPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  primary: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  quick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: MIN_TAP_TARGET,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: colors.textOnPrimaryMuted,
  },
  pressed: { opacity: 0.6 },
  panel: { gap: spacing.md },
});
