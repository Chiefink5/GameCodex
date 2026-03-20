window.GCStorage = (() => {
  const DB_NAME = 'gameCodexDB';
  const STORE = 'appState';
  const STATE_KEY = 'state';
  const OLD_KEYS = [
    'gameCodexV11Redo',
    'gameCodexV11',
    'gameCodexV10',
    'gameCodexV9',
    'gameCodexV8Persistent',
    'gameCodexV12',
    'gameCodexV12_1'
  ];

  function openDB(){
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, work){
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let settled = false;

        const finish = (fn, value) => {
          if (settled) return;
          settled = true;
          fn(value);
        };

        tx.oncomplete = () => finish(resolve);
        tx.onerror = () => finish(reject, tx.error);
        tx.onabort = () => finish(reject, tx.error);

        const result = work(store, tx, resolve, reject);
        if (mode === 'readonly') finish(resolve, result);
      });
    } finally {
      db.close();
    }
  }

  function getState(){
    return withStore('readonly', (store) => new Promise((resolve, reject) => {
      const request = store.get(STATE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    }));
  }

  function setState(state){
    return withStore('readwrite', (store) => {
      store.put(state, STATE_KEY);
    });
  }

  async function migrateFromLocalStorage(defaultState){
    const current = await getState();
    if (current) return current;

    for (const key of OLD_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const merged = Object.assign(structuredClone(defaultState), JSON.parse(raw));
        await setState(merged);
        return merged;
      } catch {}
    }

    await setState(defaultState);
    return defaultState;
  }

  return { getState, setState, migrateFromLocalStorage };
})();
