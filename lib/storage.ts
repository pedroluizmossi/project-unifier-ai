
import { ProjectSession, SavedResponse } from '../types';

const DB_NAME = 'ProjectUnifierDB';
const STORE_NAME = 'sessions';
const FAVORITES_STORE = 'favorites';
const DB_VERSION = 2; // Incremented version

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSession = async (session: ProjectSession) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(session);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getSessions = async (): Promise<ProjectSession[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.lastUpdated - a.lastUpdated));
    request.onerror = () => reject(request.error);
  });
};

export const deleteSession = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveFavorite = async (fav: SavedResponse) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FAVORITES_STORE, 'readwrite');
    const store = transaction.objectStore(FAVORITES_STORE);
    store.put(fav);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getFavorites = async (): Promise<SavedResponse[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FAVORITES_STORE, 'readonly');
    const store = transaction.objectStore(FAVORITES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
};

export const deleteFavorite = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FAVORITES_STORE, 'readwrite');
    const store = transaction.objectStore(FAVORITES_STORE);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
