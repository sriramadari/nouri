import AsyncStorage from '@react-native-async-storage/async-storage';

/** Loads a fresh copy of the module, like a new app launch: in memory cache gone, storage kept. */
function launchApp(): typeof import('./device-id') {
  let loaded: typeof import('./device-id') | undefined;
  jest.isolateModules(() => {
    // Reloading a module in Jest requires require(); dynamic import() is not supported here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('./device-id');
  });
  return loaded!;
}

describe('getDeviceId', () => {
  beforeEach(() => AsyncStorage.clear());

  it('creates a UUID once and keeps it across app launches', async () => {
    const first = await launchApp().getDeviceId();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);

    const afterRestart = await launchApp().getDeviceId();
    expect(afterRestart).toBe(first);
  });
});
