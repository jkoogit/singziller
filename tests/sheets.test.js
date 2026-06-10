const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function loadApp() {
  const storage = new Map();
  const sandbox = {
    console,
    crypto: { randomUUID: () => "test-id-" + Math.random().toString(16).slice(2) },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
    document: {
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    window: { addEventListener() {} },
    navigator: { onLine: true, serviceWorker: { register() {} } },
    alert() {},
    FormData: function FormData() { return new Map(); },
    Blob,
    URL,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("app.js", "utf8"), sandbox);
  return sandbox;
}

const app = loadApp();

assert.deepStrictEqual(Array.from(app.SHEET_HEADERS), [
  "brand",
  "title",
  "artist",
  "songNumber",
  "category",
  "version",
  "createdAt",
  "updatedAt",
  "createdBy",
  "youtubeUrl",
  "spotifyUrl",
]);

const song = {
  id: "abc",
  brand: "TJ",
  title: "Ditto",
  artist: "NewJeans",
  songNumber: "82802",
  category: "K-POP",
  version: "반주",
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-10T00:00:00.000Z",
  createdBy: "tester",
  youtubeUrl: "https://youtube.example",
  spotifyUrl: "https://spotify.example",
};

const row = app.songToSheetRow(song);
assert.strictEqual(row.length, app.SHEET_HEADERS.length);
assert.strictEqual(row[0], "TJ");
assert.strictEqual(row[1], "Ditto");

const parsed = app.sheetRowsToSongs([app.SHEET_HEADERS, row]);
assert.strictEqual(parsed.length, 1);
assert.strictEqual(parsed[0].brand, "TJ");
assert.strictEqual(parsed[0].title, "Ditto");
assert.strictEqual(parsed[0].songNumber, "82802");

assert.strictEqual(app.sheetRange("songs"), "'songs'!A:K");
assert.strictEqual(app.sheetRange("My Sheet"), "'My Sheet'!A:K");
assert.strictEqual(app.sheetRange("O'Brien"), "'O''Brien'!A:K");

assert.strictEqual(
  app.sheetsValuesUrl("sheet123", "songs", "get"),
  "https://sheets.googleapis.com/v4/spreadsheets/sheet123/values/'songs'!A%3AK"
);
assert.strictEqual(
  app.sheetsValuesUrl("sheet123", "songs", "update"),
  "https://sheets.googleapis.com/v4/spreadsheets/sheet123/values/'songs'!A1%3AK?valueInputOption=RAW"
);
assert.strictEqual(
  app.sheetsValuesUrl("sheet123", "songs", "append"),
  "https://sheets.googleapis.com/v4/spreadsheets/sheet123/values/'songs'!A%3AK:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS"
);

console.log("sheets tests passed");
