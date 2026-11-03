import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { PickedFile } from '@/lib/api/upload';

/** Wide enough for the AI to read a thali or a lab report, small enough to upload fast on 4G. */
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.7;

export type PhotoResult =
  { status: 'picked'; file: PickedFile } | { status: 'cancelled' } | { status: 'denied' };

/**
 * Takes or picks a photo (a meal or a lab report) and compresses it on the device (about
 * 1280 px wide, JPEG 0.7), typically from several MB down to around 200 KB before upload.
 */
export async function capturePhoto(
  source: 'camera' | 'library',
  fileName = 'photo.jpg',
): Promise<PhotoResult> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: 'cancelled' };

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const resized = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { status: 'picked', file: { uri: resized.uri, name: fileName, mimeType: 'image/jpeg' } };
}
