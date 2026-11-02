import { Platform } from 'react-native';

import { UPLOAD_FIELD } from './upload-field';

/** A file chosen with a picker or recorded on the device. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string;
  /** Present on web when the picker gives the browser File object. */
  file?: File;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  m4a: 'audio/mp4',
  webm: 'audio/webm',
};

/**
 * Builds the multipart body the API expects.
 * - Web: a real File or Blob (blob: and data: URLs from the camera or recorder are fetched).
 * - Native: a { uri, name, type } descriptor; React Native streams the file from disk.
 */
export async function buildUploadForm(picked: PickedFile): Promise<FormData> {
  const form = new FormData();
  const type =
    picked.mimeType ?? MIME_BY_EXTENSION[extensionOf(picked.name)] ?? 'application/octet-stream';

  if (picked.file) {
    form.append(UPLOAD_FIELD, picked.file);
  } else if (Platform.OS === 'web') {
    const blob = await (await fetch(picked.uri)).blob();
    form.append(UPLOAD_FIELD, new File([blob], picked.name, { type: blob.type || type }));
  } else {
    // React Native's FormData accepts this descriptor; the DOM typings only know Blob.
    form.append(UPLOAD_FIELD, { uri: picked.uri, name: picked.name, type } as unknown as Blob);
  }
  return form;
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}
