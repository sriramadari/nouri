import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Tests talk to a fake server; pin the URL so no Metro host lookup is needed.
process.env.EXPO_PUBLIC_API_URL = 'http://api.test';

// expo-crypto is a native module; in tests, back it with Node's implementation.
jest.mock('expo-crypto', () => ({ randomUUID: () => require('node:crypto').randomUUID() }));

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
