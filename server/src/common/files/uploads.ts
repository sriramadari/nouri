import { AppError } from '../errors/app-error.js';

/** Multipart field name used by every upload endpoint. */
export const UPLOAD_FIELD = 'file';

export const MB = 1024 * 1024;

/** Formats Gemini reads natively. HEIC covers iPhone photos. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Phones record AAC in an MP4/M4A container; the rest cover web recorders and uploads. */
export const AUDIO_TYPES = [
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
];

export const PDF_TYPES = ['application/pdf'];

/**
 * Checks that an upload is present and of an allowed type. Files stay in memory and are
 * never written to disk.
 */
export function requireUpload(
  file: Express.Multer.File | undefined,
  allowedTypes: string[],
  label: string,
): Express.Multer.File {
  if (!file || file.size === 0) {
    throw new AppError('FILE_MISSING', `Please attach a ${label} in the "${UPLOAD_FIELD}" field.`);
  }
  const mimeType = normalizeMimeType(file.mimetype);
  if (!allowedTypes.includes(mimeType)) {
    throw new AppError(
      'UNSUPPORTED_FILE_TYPE',
      `Katori can't read ${file.mimetype} files as a ${label}.`,
      {
        allowed: allowedTypes,
      },
    );
  }
  return { ...file, mimetype: mimeType };
}

/** Drops parameters such as "; codecs=opus" and lower cases the type. */
function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';')[0]!.trim().toLowerCase();
}
