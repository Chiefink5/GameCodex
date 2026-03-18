window.GCStorage = (() => {
  const DB_NAME = 'gameCodexDB';
  const STORE = 'appState';
  const STATE_KEY = 'state';
  const OLD_KEYS = ['gameCodexV11Redo','gameCodexV11','gameCodexV10','gameCodexV9','gameCodexV8Persistent','gameCodexV12','gameCodexV12_1'];

  function openDB(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getState(){
    const db = await openDB();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  }

  async function setState(state){
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function migrateFromLocalStorage(defaultState){
    const current = await getState();
    if (current) return current;

    for (const key of OLD_KEYS){
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try{
        const parsed = JSON.parse(raw);
        const merged = Object.assign(structuredClone(defaultState), parsed);
        await setState(merged);
        return merged;
      }catch(e){}
    }
    await setState(defaultState);
    return defaultState;
  }

  return { getState, setState, migrateFromLocalStorage };
})();