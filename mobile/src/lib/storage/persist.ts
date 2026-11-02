import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Shared storage adapter for persisted zustand stores (AsyncStorage on phones, localStorage on web). */
export const persistStorage = createJSONStorage(() => AsyncStorage);
