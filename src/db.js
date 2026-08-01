/* Persistência em IndexedDB — não usar localStorage (docs/CONTEXTO.md §6). */

const BANCO = "patch-dmx";
const STORE = "kv";
const CHAVE = "show";

function abrir() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function carregar() {
  try {
    const db = await abrir();
    return await new Promise((resolve, reject) => {
      const req = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(CHAVE);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function salvar(dados) {
  try {
    const db = await abrir();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dados, CHAVE);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* sem storage: segue em memória */
  }
}
