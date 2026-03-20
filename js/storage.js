window.GCStorage = (() => {
  const DB_NAME = 'gameCodexDB';
  const STORE = 'appState';
  const STATE_KEY = 'state';
  const FALLBACK_KEY = 'gameCodexStateFallback';
  const OLD_KEYS = [
    'gameCodexV11Redo',
    'gameCodexV11',
    'gameCodexV10',
    'gameCodexV9',
    'gameCodexV8Persistent',
    'gameCodexV12',
    'gameCodexV12_1'
  ];

  function readFallback(){
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeFallback(state){
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function openDB(){
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }

  async function withStore(mode, work){
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const result = work(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });
    } finally {
      db.close();
    }
  }

  async function getState(){
    try {
      const result = await withStore('readonly', (store) => new Promise((resolve, reject) => {
        const request = store.get(STATE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
      }));
      return await result;
    } catch {
      return readFallback();
    }
  }

  async function setState(state){
    const fallbackOk = writeFallback(state);
    try {
      await withStore('readwrite', (store) => {
        store.put(state, STATE_KEY);
      });
      return true;
    } catch (err) {
      if (fallbackOk) return false;
      throw err;
    }
  }

  async function migrateFromLocalStorage(defaultState){
    const current = await getState();
    if (current) return current;

    for (const key of [FALLBACK_KEY].concat(OLD_KEYS)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const merged = Object.assign(window.GCUtils.clone(defaultState), JSON.parse(raw));
        await setState(merged);
        return merged;
      } catch {}
    }

    await setState(defaultState);
    return defaultState;
  }

  return { getState, setState, migrateFromLocalStorage };
})();
