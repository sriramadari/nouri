import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { toApiError } from '@/lib/api/api-error';
import { api } from '@/lib/api/endpoints';
import type { Biomarker, ReportResponse } from '@/lib/api/types';
import { useProfileStore } from '@/lib/storage/profile-store';
import { radii, spacing } from '@/theme';

import { BiomarkerRow } from './components/BiomarkerRow';
import { BiomarkerSheet } from './components/BiomarkerSheet';
import {
  CameraDenied,
  latestReportKey,
  type ReportSource,
  toFlaggedMarkers,
  UploadCancelled,
  useReportUpload,
} from './report-upload';

/** Health: read a blood report, see what is out of range, and what to eat about it. */
export function HealthScreen() {
  const latest = useQuery({ queryKey: latestReportKey, queryFn: api.getLatestReport });
  const upload = useReportUpload();
  const [selected, setSelected] = useState<Biomarker | null>(null);
  const setFlaggedMarkers = useProfileStore((state) => state.setFlaggedMarkers);

  // Keep Today's focus areas in step with the newest report on the server.
  useEffect(() => {
    if (latest.data) setFlaggedMarkers(toFlaggedMarkers(latest.data));
  }, [latest.data, setFlaggedMarkers]);

  const start = (source: ReportSource) =>
    upload.mutate(source, {
      onError: (error) => {
        if (error instanceof UploadCancelled) upload.reset();
      },
    });

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Health
      </Text>

      {upload.isPending ? <Reading /> : null}
      {upload.isError ? <UploadProblem error={upload.error} onChoose={start} /> : null}
      {!upload.isPending ? (
        <LatestReport
          query={latest}
          justUploaded={upload.data ?? null}
          onSelect={setSelected}
          onUpload={start}
        />
      ) : null}

      <BiomarkerSheet marker={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function UploadButtons({
  onChoose,
  compact = false,
}: {
  onChoose: (source: ReportSource) => void;
  compact?: boolean;
}) {
  return (
    <View style={compact ? styles.buttonsRow : styles.buttons}>
      <View style={compact ? styles.flex : undefined}>
        <Button label="Take a photo" icon="camera" onPress={() => onChoose('camera')} fullWidth />
      </View>
      <View style={compact ? styles.flex : undefined}>
        <Button
          label="PDF or photo"
          icon="file"
          variant="secondary"
          onPress={() => onChoose('files')}
          fullWidth
        />
      </View>
    </View>
  );
}

function Reading() {
  return (
    <Card style={styles.reading} accessibilityLabel="Reading your report" accessible>
      <Text variant="heading">Reading your report</Text>
      <Text color="textSecondary">
        Nouri is finding each result, converting units and comparing with healthy ranges. This can
        take up to a minute.
      </Text>
      <Skeleton height={44} radius={radii.md} />
      <Skeleton height={44} radius={radii.md} />
      <Skeleton height={44} radius={radii.md} />
    </Card>
  );
}

function UploadProblem({
  error,
  onChoose,
}: {
  error: Error;
  onChoose: (source: ReportSource) => void;
}) {
  if (error instanceof UploadCancelled) return null;
  if (error instanceof CameraDenied) {
    return (
      <Card>
        <ErrorState
          title="Camera access is off"
          message="Turn it on in Settings, or upload a PDF or a photo you already have."
        />
        <Button
          label="Open Settings"
          variant="secondary"
          onPress={() => Linking.openSettings()}
          fullWidth
        />
        <Button label="PDF or photo" variant="ghost" onPress={() => onChoose('files')} fullWidth />
      </Card>
    );
  }
  const apiError = toApiError(error);
  return (
    <Card>
      <ErrorState
        title={apiError.isConnectionProblem ? 'You’re offline' : 'Couldn’t read that report'}
        offline={apiError.isConnectionProblem}
        message={
          apiError.isConnectionProblem
            ? 'Reading a report needs the internet. Try again when you’re connected.'
            : apiError.message
        }
      />
      <UploadButtons onChoose={onChoose} compact />
    </Card>
  );
}

function LatestReport({
  query,
  justUploaded,
  onSelect,
  onUpload,
}: {
  query: ReturnType<typeof useQuery<ReportResponse | null>>;
  justUploaded: ReportResponse | null;
  onSelect: (marker: Biomarker) => void;
  onUpload: (source: ReportSource) => void;
}) {
  if (query.isPending) {
    return (
      <View style={styles.list}>
        <Skeleton height={80} radius={radii.lg} />
        <Skeleton height={240} radius={radii.lg} />
      </View>
    );
  }
  if (query.isError) {
    const error = toApiError(query.error);
    return (
      <ErrorState
        offline={error.isConnectionProblem}
        message={
          error.isConnectionProblem
            ? 'Your results will appear when you’re back online.'
            : error.message
        }
        onRetry={() => query.refetch()}
      />
    );
  }

  const report = query.data;
  if (!report) {
    return (
      <Card>
        <EmptyState
          icon="health"
          title="Your lab results, explained"
          message="Upload a blood report. Nouri finds sugar, cholesterol, vitamin D and more, explains each one, and adjusts your plan."
        />
        <UploadButtons onChoose={onUpload} />
        <Text variant="caption" color="textMuted" align="center">
          The file is read by AI and then discarded; only the results are kept.
        </Text>
      </Card>
    );
  }

  const flagged = report.biomarkers.filter((marker) => marker.status !== 'NORMAL').length;
  const skipped = justUploaded?.id === report.id ? (justUploaded.skipped ?? []) : [];
  const uploaded = new Date(report.uploadedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.list}>
      <Card tone={flagged > 0 ? 'accentTint' : 'primaryTint'}>
        <Text variant="heading">
          {flagged > 0
            ? `${flagged} of ${report.biomarkers.length} results need attention`
            : 'All results in a healthy range'}
        </Text>
        <Text color="textSecondary">
          Report from {uploaded}. {flagged > 0 ? 'Your focus areas on Today now include them.' : ''}
        </Text>
        {skipped.length > 0 ? (
          <Text variant="caption" color="textSecondary">
            {skipped.length} result{skipped.length > 1 ? 's' : ''} couldn’t be read clearly:{' '}
            {skipped.map((item) => item.name).join(', ')}.
          </Text>
        ) : null}
      </Card>

      <Card style={styles.markers}>
        {report.biomarkers.map((marker) => (
          <BiomarkerRow key={marker.id} marker={marker} onPress={() => onSelect(marker)} />
        ))}
      </Card>

      <Text variant="heading">Have a newer report?</Text>
      <UploadButtons onChoose={onUpload} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  markers: { padding: 0, gap: 0, overflow: 'hidden' },
  reading: { gap: spacing.md },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
  buttonsRow: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
