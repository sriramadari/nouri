import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3000;

/**
 * Where the Katori API lives.
 * - EXPO_PUBLIC_API_URL wins when set (always set for release builds).
 * - In development it falls back to the computer serving the app: the Metro host on a phone
 *   (same Wi-Fi, zero setup) or the page's host on web.
 * Never throws: a crash at import time would take down the whole app, error screen included.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const devHost =
    Platform.OS === 'web'
      ? globalThis.location?.hostname
      : Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && devHost) return `http://${devHost}:${API_PORT}`;

  console.warn('EXPO_PUBLIC_API_URL is not set; falling back to localhost.');
  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
