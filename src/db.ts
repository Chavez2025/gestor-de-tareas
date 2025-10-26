import { openDB, DBSchema } from 'idb';

interface Recording {
  id: number;
  name: string;
  blob: Blob;
  date: string;
  user: string;
}

interface RecordingsDB extends DBSchema {
  recordings: {
    key: number;
    value: Recording;
    indexes: { 'by-user': string };
  };
}

const dbPromise = openDB<RecordingsDB>('screen-recordings-db', 1, {
  upgrade(db) {
    const store = db.createObjectStore('recordings', {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.createIndex('by-user', 'user');
  },
});

export const addRecording = async (recording: Omit<Recording, 'id'>) => {
  return (await dbPromise).add('recordings', recording as any);
};

export const getAllRecordingsForUser = async (user: string) => {
  return (await dbPromise).getAllFromIndex('recordings', 'by-user', user);
};

export const updateRecordingName = async (id: number, name: string) => {
  const db = await dbPromise;
  const record = await db.get('recordings', id);
  if (record) {
    record.name = name;
    return db.put('recordings', record);
  }
};