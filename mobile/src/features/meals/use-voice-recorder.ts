import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import type { PickedFile } from '@/lib/api/upload';

/** Long enough for "two rotis, dal, a bowl of curd and a glass of chaas". */
export const MAX_RECORDING_MS = 30_000;
const MIN_RECORDING_MS = 1_000;
/** Quieter than this for the whole note means nobody spoke (dBFS; speech is around -30). */
const SILENCE_THRESHOLD_DB = -45;

export type VoiceResult =
  { status: 'recorded'; file: PickedFile } | { status: 'too-short' } | { status: 'silent' };

/**
 * Records a short voice note with a live timer. Checks on the device that something was
 * actually said, which saves an upload and catches silence before the AI can guess at it.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 200);
  const loudest = useRef<number | null>(null);

  useEffect(() => {
    if (state.isRecording && state.metering !== undefined) {
      loudest.current = Math.max(loudest.current ?? -160, state.metering);
    }
  }, [state.isRecording, state.metering]);

  const start = async (): Promise<'recording' | 'denied'> => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) return 'denied';
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    loudest.current = null;
    await recorder.prepareToRecordAsync();
    recorder.record();
    return 'recording';
  };

  const finish = async () => {
    await recorder.stop();
    // Hand audio back to playback so the speaker works normally afterwards.
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
  };

  const stop = async (): Promise<VoiceResult> => {
    const durationMillis = recorder.getStatus().durationMillis;
    await finish();
    if (durationMillis < MIN_RECORDING_MS || !recorder.uri) return { status: 'too-short' };
    const isWeb = Platform.OS === 'web';
    // Browser metering does not report real speech levels, so the on-device silence check
    // runs on phones only. The server's listen-first step still catches silence everywhere.
    if (!isWeb && loudest.current !== null && loudest.current < SILENCE_THRESHOLD_DB) {
      return { status: 'silent' };
    }

    return {
      status: 'recorded',
      file: {
        uri: recorder.uri,
        name: isWeb ? 'note.webm' : 'note.m4a',
        mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
      },
    };
  };

  return {
    start,
    stop,
    cancel: finish,
    isRecording: state.isRecording,
    durationMillis: state.durationMillis,
  };
}
