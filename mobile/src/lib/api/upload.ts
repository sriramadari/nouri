import { UPLOAD_FIELD } from './upload-field';

/** A file chosen with the document or image picker. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string;
  /** Present on web: the browser File object. */
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
};

/**
 * Builds the multipart body the API expects. Browsers send a real File; React Native sends
 * a { uri, name, type } descriptor and reads the file from disk itself.
 */
export function toUploadForm(picked: PickedFile): FormData {
  const form = new FormData();
  if (picked.file) {
    form.append(UPLOAD_FIELD, picked.file);
    return form;
  }
  const extension = picked.name.split('.').pop()?.toLowerCase() ?? '';
  const descriptor = {
    uri: picked.uri,
    name: picked.name,
    type: picked.mimeType ?? MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
  };
  // React Native's FormData accepts this descriptor; the DOM typings only know Blob.
  form.append(UPLOAD_FIELD, descriptor as unknown as Blob);
  return form;
}
