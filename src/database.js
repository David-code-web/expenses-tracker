import initSqlJs from 'sql.js';

const DB_KEY = 'daily-ledger-sqlite';
let db;
let ready;

function persist() {
  const bytes = db.export();
  const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('daily-ledger-storage', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('database');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tx = request.result.transaction('database', 'readwrite');
      tx.objectStore('database').put(blob, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function loadSavedBytes() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('daily-ledger-storage', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('database');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const tx = request.result.transaction('database', 'readonly');
      const get = tx.objectStore('database').get(DB_KEY);
      get.onsuccess = async () => resolve(get.result ? new Uint8Array(await get.result.arrayBuffer()) : null);
      get.onerror = () => reject(get.error);
    };
  });
}

export async function initDatabase() {
  if (!ready) {
    ready = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
      });
      const bytes = await loadSavedBytes();
      db = bytes ? new SQL.Database(bytes) : new SQL.Database();
      db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('income', 'expense')),
        amount REAL NOT NULL CHECK(amount > 0),
        date TEXT NOT NULL,
        note TEXT DEFAULT ''
      )`);
      await persist();
    })();
  }
  await ready;
  return db;
}

export async function getTransactions() {
  await initDatabase();
  return db.exec('SELECT * FROM transactions ORDER BY date DESC, id DESC')[0]?.values.map((row) => ({
    id: row[0], title: row[1], category: row[2], kind: row[3], amount: row[4], date: row[5], note: row[6],
  })) ?? [];
}

export async function saveTransaction(transaction) {
  await initDatabase();
  const { id, title, category, kind, amount, date, note } = transaction;
  if (id) {
    db.run('UPDATE transactions SET title=?, category=?, kind=?, amount=?, date=?, note=? WHERE id=?', [title, category, kind, amount, date, note, id]);
  } else {
    db.run('INSERT INTO transactions (title, category, kind, amount, date, note) VALUES (?, ?, ?, ?, ?, ?)', [title, category, kind, amount, date, note]);
  }
  await persist();
}

export async function removeTransaction(id) {
  await initDatabase();
  db.run('DELETE FROM transactions WHERE id=?', [id]);
  await persist();
}
