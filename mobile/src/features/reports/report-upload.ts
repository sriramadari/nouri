import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';

import { api } from '@/lib/api/endpoints';
import { queryClient } from '@/lib/api/query-client';
import type { ReportResponse } from '@/lib/api/types';
import { buildUploadForm, type PickedFile } from '@/lib/api/upload';
import type { FlaggedMarker } from '@/lib/health/focus-areas';
import { capturePhoto } from '@/lib/media/capture-photo';
import { useProfileStore } from '@/lib/storage/profile-store';

export const latestReportKey = ['report', 'latest'] as const;

export type ReportSource = 'camera' | 'files';

/** Thrown when the person cannot or did not choose a file; not an error worth showing. */
export class UploadCancelled extends Error {}
export class CameraDenied extends Error {}

async function pickReport(source: ReportSource): Promise<PickedFile> {
  if (source === 'camera') {
    const photo = await capturePhoto('camera', 'report.jpg');
    if (photo.status === 'denied') throw new CameraDenied();
    if (photo.status === 'cancelled') throw new UploadCancelled();
    return photo.file;
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) throw new UploadCancelled();
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, file: asset.file };
}

export function toFlaggedMarkers(report: ReportResponse): FlaggedMarker[] {
  return report.biomarkers.flatMap((marker) =>
    marker.status === 'NORMAL'
      ? []
      : [{ key: marker.key, name: marker.name, status: marker.status }],
  );
}

/**
 * Picks and uploads a report. On success the latest report cache and the focus areas are
 * updated together, so Today reflects the new results without a refresh.
 */
export function useReportUpload() {
  return useMutation({
    mutationFn: async (source: ReportSource) =>
      api.uploadReport(await buildUploadForm(await pickReport(source))),
    onSuccess: (report) => {
      queryClient.setQueryData(latestReportKey, report);
      useProfileStore.getState().setFlaggedMarkers(toFlaggedMarkers(report));
    },
  });
}
