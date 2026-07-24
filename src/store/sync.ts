import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore';
import type { AppData } from '../types';

const SYNC_KEY = 'family-finance-sync-config';
const APP_NAME = 'family-finance-sync';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface SyncConfig {
  firebaseConfig: FirebaseWebConfig;
  familyCode: string;
}

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncConfig;
    if (!parsed.firebaseConfig?.projectId || !parsed.familyCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSyncConfig(config: SyncConfig | null) {
  if (config) localStorage.setItem(SYNC_KEY, JSON.stringify(config));
  else localStorage.removeItem(SYNC_KEY);
}

export function generateFamilyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 3) code += '-';
  }
  return code;
}

let cachedApp: FirebaseApp | null = null;
let cachedKey = '';

function getFirestoreFor(config: FirebaseWebConfig): Firestore {
  const key = JSON.stringify(config);
  if (cachedApp && cachedKey === key) return getFirestore(cachedApp);

  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    deleteApp(existing).catch(() => {});
  }
  cachedApp = initializeApp(config, APP_NAME);
  cachedKey = key;
  return getFirestore(cachedApp);
}

export function subscribeToFamily(
  config: SyncConfig,
  onData: (data: AppData | null) => void,
  onError: (message: string) => void
): () => void {
  try {
    const db = getFirestoreFor(config.firebaseConfig);
    const ref = doc(db, 'families', config.familyCode);
    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        if (data && Array.isArray(data.members)) {
          onData(data as unknown as AppData);
        } else {
          onData(null);
        }
      },
      (err) => onError(err.message)
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : String(err));
    return () => {};
  }
}

export async function pushFamilyData(config: SyncConfig, data: AppData): Promise<void> {
  const db = getFirestoreFor(config.firebaseConfig);
  const ref = doc(db, 'families', config.familyCode);
  await setDoc(ref, data);
}
