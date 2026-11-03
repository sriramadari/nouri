import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AdaptiveSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  ProgressRing,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { toApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import { API_URL } from '@/lib/config';
import { getDeviceId } from '@/lib/storage/device-id';
import { useProfileStore } from '@/lib/storage/profile-store';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { sendTestReminder } from '@/features/today/meal-reminders';
import { useCelebration } from '@/features/today/celebration-store';
import { spacing } from '@/theme';

/**
 * Developer screen: every UI kit component in one place plus a live check that the API
 * client reaches the server. Never reachable in release builds.
 */
export default function DevScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DevGallery />;
}

function DevGallery() {
  // ?sheet=open opens the sheet on load, so screenshots can check both sheet layouts.
  const { sheet } = useLocalSearchParams<{ sheet?: string }>();
  const [sheetOpen, setSheetOpen] = useState(sheet === 'open');
  const [ringValue, setRingValue] = useState(820);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const health = useQuery({ queryKey: ['health'], queryFn: api.health });
  const me = useQuery({ queryKey: ['me'], queryFn: api.getMe });
  const deviceId = useQuery({ queryKey: ['deviceId'], queryFn: getDeviceId });

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'UI kit' }} />

      <Card>
        <Text variant="heading">Server connection</Text>
        <Text variant="caption" color="textSecondary">
          {API_URL}
        </Text>
        {health.isPending ? (
          <Skeleton width="60%" />
        ) : health.isError ? (
          <Text color="danger">{toApiError(health.error).message}</Text>
        ) : (
          <Text color="success">
            API {health.data.status}, database {health.data.database}
          </Text>
        )}
        <Text variant="caption" color="textSecondary">
          Device id: {deviceId.data ?? '…'}
        </Text>
        <Text variant="caption" color="textSecondary">
          User:{' '}
          {me.data
            ? `${me.data.id} (profile ${me.data.profile ? 'set' : 'not set'})`
            : me.isError
              ? toApiError(me.error).code
              : '…'}
        </Text>
        <Button
          label="Check again"
          variant="secondary"
          icon="refresh"
          onPress={() => health.refetch()}
        />
        <Button
          label="Send a test reminder in 10 s"
          variant="ghost"
          onPress={async () => {
            const sent = await sendTestReminder(10);
            setReminderStatus(sent ? 'Scheduled. Lock the phone and wait.' : 'Not available here.');
          }}
        />
        {reminderStatus ? (
          <Text variant="caption" color="textSecondary">
            {reminderStatus}
          </Text>
        ) : null}
        <Button
          label="Replay goal celebration"
          variant="ghost"
          onPress={() => useCelebration.getState().start(`replay-${Date.now()}`)}
        />
        <Button
          label="Reset onboarding"
          variant="ghost"
          onPress={() => {
            useOnboardingDraft.getState().reset();
            useProfileStore.getState().reset();
          }}
        />
      </Card>

      <Text variant="title">Typography</Text>
      <Text variant="display">Display</Text>
      <Text variant="title">Title</Text>
      <Text variant="heading">Heading</Text>
      <Text>Body text in the assistant’s voice.</Text>
      <Text variant="caption" color="textSecondary">
        Caption text
      </Text>

      <Text variant="title">Buttons</Text>
      <Button label="Snap a meal" icon="camera" fullWidth />
      <Button label="Speak" icon="mic" variant="secondary" fullWidth />
      <Button label="Saving" loading fullWidth />
      <Button label="Disabled" disabled fullWidth />

      <Text variant="title">Progress rings</Text>
      <View style={styles.row}>
        <ProgressRing
          value={ringValue}
          max={1600}
          accessibilityLabel={`${ringValue} of 1600 calories`}
        >
          <Text variant="title">{1600 - ringValue}</Text>
          <Text variant="caption" color="textSecondary">
            kcal left
          </Text>
        </ProgressRing>
        <ProgressRing
          value={42}
          max={80}
          size={110}
          strokeWidth={10}
          color="accent"
          accessibilityLabel="42 of 80 grams protein"
        >
          <Text variant="heading">38 g</Text>
          <Text variant="caption" color="textSecondary">
            protein
          </Text>
        </ProgressRing>
      </View>
      <Button
        label="Add 250 kcal"
        variant="secondary"
        icon="plus"
        onPress={() => setRingValue((value) => Math.min(value + 250, 1600))}
      />

      <Text variant="title">Chips</Text>
      <View style={styles.wrap}>
        <Chip label="Roti" detail="2 medium · 240 kcal" onRemove={() => undefined} />
        <Chip
          label="Aloo gobi"
          detail="1 katori · 150 kcal"
          needsReview
          onPress={() => undefined}
        />
      </View>

      <Text variant="title">Cards and loading</Text>
      <Card tone="primaryTint">
        <Text variant="bodyStrong">Katori noticed you’re low on protein today</Text>
        <Text color="textSecondary">A katori of dal or curd at dinner closes the gap.</Text>
      </Card>
      <Card>
        <Skeleton width="40%" height={20} />
        <Skeleton />
        <Skeleton width="80%" />
      </Card>

      <Text variant="title">States</Text>
      <Card>
        <EmptyState
          icon="camera"
          title="No meals yet"
          message="Snap your first meal and Katori does the rest."
          action={{ label: 'Snap a meal', icon: 'camera', onPress: () => undefined }}
        />
      </Card>
      <Card>
        <ErrorState
          offline
          message="You're offline. Meals you log will sync later."
          onRetry={() => undefined}
        />
      </Card>

      <Text variant="title">Adaptive sheet</Text>
      <Button label="Open sheet" onPress={() => setSheetOpen(true)} fullWidth />
      <AdaptiveSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Lunch"
        footer={
          <Button label="Save meal" icon="check" fullWidth onPress={() => setSheetOpen(false)} />
        }
      >
        <Text color="textSecondary">
          A bottom sheet on phones, a centred dialog on wide screens.
        </Text>
        <View style={styles.wrap}>
          <Chip label="Roti" detail="2 medium · 240 kcal" />
          <Chip label="Dal tadka" detail="1 katori · 180 kcal" />
        </View>
      </AdaptiveSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
