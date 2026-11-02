import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const STORAGE_KEY = 'nouri.deviceId';

let cached: Promise<string> | undefined;

/**
 * The app's identity without a login: a random UUID created on first launch and kept on the
 * device. The server links all data to it through the x-device-id header.
 */
export function getDeviceId(): Promise<string> {
  cached ??= loadOrCreate().catch((error: unknown) => {
    cached = undefined; // let the next call try again instead of caching the failure
    throw error;
  });
  return cached;
}

async function loadOrCreate(): Promise<string> {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const created = randomUUID();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
}
