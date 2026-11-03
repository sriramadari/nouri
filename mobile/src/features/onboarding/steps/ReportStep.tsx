import { StyleSheet, View } from 'react-native';

import { Button, Card, ErrorState, Icon, Text } from '@/components/ui';
import {
  toFlaggedMarkers,
  UploadCancelled,
  useReportUpload,
} from '@/features/reports/report-upload';
import { toApiError } from '@/lib/api/api-error';
import { spacing } from '@/theme';

import { StepLayout } from '../components/StepLayout';
import { useFinishOnboarding } from '../finish-onboarding';
import { useOnboardingDraft } from '../onboarding-draft';

export function ReportStep() {
  const update = useOnboardingDraft((state) => state.update);
  const finish = useFinishOnboarding();
  const upload = useReportUpload();
  const report = upload.data ?? null;
  const start = () =>
    upload.mutate('files', {
      onSuccess: (result) => update({ flaggedMarkers: toFlaggedMarkers(result) }),
      onError: (error) => {
        if (error instanceof UploadCancelled) upload.reset();
      },
    });

  if (upload.isPending) {
    return (
      <StepLayout
        step="report"
        title="Reading your report"
        subtitle="Katori is finding each result and what it means. This can take up to a minute."
        onContinue={() => undefined}
        continueLabel="Reading…"
        continueLoading
      >
        <Card tone="brandTint" style={styles.reading}>
          <Icon name="file" size={32} color="primary" />
          <Text color="textSecondary" align="center">
            Hang tight, it’s worth it.
          </Text>
        </Card>
      </StepLayout>
    );
  }

  if (report) {
    const flagged = report.biomarkers.filter((marker) => marker.status !== 'NORMAL');
    return (
      <StepLayout
        step="report"
        title="Got it"
        subtitle="Your plan will focus on what your results say."
        onContinue={finish}
        continueLabel="See my plan"
      >
        <Card>
          <Text variant="heading">
            {report.biomarkers.length} results read, {flagged.length} need attention
          </Text>
          {flagged.length > 0 ? (
            <Text color="textSecondary">{flagged.map((marker) => marker.name).join(', ')}</Text>
          ) : (
            <Text color="textSecondary">Everything Katori tracks is in a healthy range.</Text>
          )}
          {report.skipped && report.skipped.length > 0 ? (
            <Text variant="caption" color="textMuted">
              {report.skipped.length} result{report.skipped.length > 1 ? 's' : ''} could not be read
              clearly and {report.skipped.length > 1 ? 'were' : 'was'} left out.
            </Text>
          ) : null}
        </Card>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      step="report"
      title="Have a recent blood report?"
      subtitle="Optional. Katori reads it and focuses your plan on what matters for you, like sugar, cholesterol or vitamin D."
      onContinue={start}
      continueLabel="Upload report"
      secondary={<Button label="Skip for now" variant="ghost" onPress={finish} fullWidth />}
    >
      {upload.isError && !(upload.error instanceof UploadCancelled) ? (
        <ErrorState
          title="Couldn’t read that report"
          message={toApiError(upload.error).message}
          offline={toApiError(upload.error).isConnectionProblem}
        />
      ) : (
        <View style={styles.points}>
          <Text color="textSecondary">• A photo or PDF of your lab results works</Text>
          <Text color="textSecondary">
            • The file is read by AI, then discarded; only the results are kept
          </Text>
          <Text color="textSecondary">• You can add one later from the Health tab</Text>
        </View>
      )}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  reading: { alignItems: 'center', paddingVertical: spacing.xxl },
  points: { gap: spacing.sm },
});
