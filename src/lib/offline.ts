const DB_NAME = 'gymtrack-offline';
const DB_VERSION = 1;

export interface OfflineWorkout {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  status: string;
  exercises: OfflineWorkoutExercise[];
  createdAt: string;
}

export interface OfflineWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: number;
  reps?: number | null;
  weight?: number | null;
  restTime: number;
  completed: boolean;
  actualSets: number;
  actualReps?: number | null;
  actualWeight?: number | null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('userId', 'userId', { unique: false });
        workoutStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('weightLogs')) {
        const weightStore = db.createObjectStore('weightLogs', { keyPath: 'id' });
        weightStore.createIndex('userId', 'userId', { unique: false });
        weightStore.createIndex('loggedAt', 'loggedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function saveWorkoutOffline(workout: OfflineWorkout): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', 'readwrite');
    const store = tx.objectStore('workouts');
    const request = store.put(workout);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineWorkouts(userId: string): Promise<OfflineWorkout[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', 'readonly');
    const store = tx.objectStore('workouts');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineWorkout(id: string): Promise<OfflineWorkout | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', 'readonly');
    const store = tx.objectStore('workouts');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineWorkout(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workouts', 'readwrite');
    const store = tx.objectStore('workouts');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveWeightLogOffline(log: {
  id: string;
  userId: string;
  weight: number;
  unit: string;
  bodyFat?: number | null;
  notes?: string | null;
  loggedAt: string;
}): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('weightLogs', 'readwrite');
    const store = tx.objectStore('weightLogs');
    const request = store.put(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineWeightLogs(userId: string): Promise<{
  id: string;
  userId: string;
  weight: number;
  unit: string;
  bodyFat?: number | null;
  notes?: string | null;
  loggedAt: string;
}[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('weightLogs', 'readonly');
    const store = tx.objectStore('weightLogs');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToSyncQueue(
  type: 'workout' | 'weight' | 'exercise',
  action: 'create' | 'update' | 'delete',
  data: unknown
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const request = store.add({
      type,
      action,
      data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0,
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncItems(): Promise<{
  id: number;
  type: string;
  action: string;
  data: unknown;
  status: string;
  retries: number;
}[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateSyncItemStatus(
  id: number,
  status: 'completed' | 'failed',
  error?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.status = status;
        item.error = error;
        item.completedAt = new Date().toISOString();
        if (status === 'failed') {
          item.retries += 1;
        }
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearCompletedSyncItems(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');
    const getRequest = index.getAll('completed');

    getRequest.onsuccess = () => {
      const items = getRequest.result;
      const deleteRequests = items.map(item => store.delete(item.id));
      Promise.all(deleteRequests.map(r => 
        new Promise<void>(resolve => {
          r.onsuccess = () => resolve();
        })
      )).then(() => resolve());
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function isOnline(): Promise<boolean> {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}
