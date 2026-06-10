const STORAGE_KEYS = {
  songs: "singziller:songs",
  repertoire: "singziller:repertoire",
  bookmarks: "singziller:bookmarkGroups",
  recordings: "singziller:recordings",
  google: "singziller:google",
};

const SHEET_HEADERS = [
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
];
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

const nowIso = () => new Date().toISOString();
const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const seedSongs = [
  song("TJ", "Ditto", "NewJeans", "82802", "K-POP", "반주", "https://www.youtube.com/results?search_query=NewJeans+Ditto", "https://open.spotify.com/search/NewJeans%20Ditto"),
  song("KY", "Ditto", "NewJeans", "95763", "K-POP", "반주", "https://www.youtube.com/results?search_query=NewJeans+Ditto", "https://open.spotify.com/search/NewJeans%20Ditto"),
  song("KY", "Ditto", "NewJeans", "95763-MR", "K-POP", "MR", "", ""),
  song("TJ", "사랑은 늘 도망가", "임영웅", "81425", "트로트", "반주", "https://www.youtube.com/results?search_query=임영웅+사랑은+늘+도망가", ""),
  song("KY", "사랑은 늘 도망가", "임영웅", "23291", "트로트", "반주", "https://www.youtube.com/results?search_query=임영웅+사랑은+늘+도망가", ""),
  song("TJ", "붉은 노을", "이문세", "1244", "7080", "원곡", "", ""),
  song("KY", "붉은 노을", "이문세", "690", "7080", "원곡", "", ""),
  song("TJ", "Dynamite", "BTS", "79431", "팝송", "반주", "https://www.youtube.com/results?search_query=BTS+Dynamite", "https://open.spotify.com/search/BTS%20Dynamite"),
  song("KY", "Dynamite", "BTS", "27554", "팝송", "라이브", "", "https://open.spotify.com/search/BTS%20Dynamite"),
  song("TJ", "곰 세 마리", "동요", "5482", "동요", "반주", "", ""),
];

function song(brand, title, artist, songNumber, category, version, youtubeUrl, spotifyUrl) {
  const createdAt = nowIso();
  return {
    id: crypto.randomUUID(),
    brand,
    title,
    artist,
    songNumber,
    category,
    version,
    createdAt,
    updatedAt: createdAt,
    createdBy: "sample",
    youtubeUrl,
    spotifyUrl,
  };
}

const state = {
  songs: readJson(STORAGE_KEYS.songs, null),
  repertoire: readJson(STORAGE_KEYS.repertoire, []),
  bookmarks: readJson(STORAGE_KEYS.bookmarks, [{ id: crypto.randomUUID(), name: "기본 시트", songIds: [] }]),
  recordings: readJson(STORAGE_KEYS.recordings, []),
  google: readJson(STORAGE_KEYS.google, { clientId: "", spreadsheetId: "", sheetName: "songs" }),
  googleAccessToken: "",
  googleTokenExpiresAt: 0,
  googleTokenClient: null,
  mediaRecorder: null,
  chunks: [],
  deferredInstall: null,
};

if (!state.songs?.length) {
  state.songs = seedSongs;
  writeJson(STORAGE_KEYS.songs, state.songs);
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindSearch();
  bindDataActions();
  bindRecorder();
  bindInstall();
  restoreGoogleForm();
  updateOnlineState();
  renderAll();
  registerServiceWorker();
});

window.addEventListener("online", updateOnlineState);
window.addEventListener("offline", updateOnlineState);

function bindTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      $$(".view").forEach((view) => view.classList.toggle("active", view.id === tab.dataset.view));
    });
  });
}

function bindSearch() {
  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearchResults();
  });
  $("#resetSearch").addEventListener("click", () => {
    $("#searchForm").reset();
    renderSearchResults();
  });
  $("#libraryCategory").addEventListener("change", renderLibrary);
}

function bindDataActions() {
  $("#importFile").addEventListener("change", importFile);
  $("#exportJson").addEventListener("click", () => download("singziller-songs.json", JSON.stringify(state.songs, null, 2), "application/json"));
  $("#exportCsv").addEventListener("click", () => download("singziller-songs.csv", toCsv(state.songs), "text/csv;charset=utf-8"));
  $("#downloadTemplate").addEventListener("click", () => download("singziller-template.csv", toCsv([]), "text/csv;charset=utf-8"));
  $("#addBookmarkGroup").addEventListener("click", addBookmarkGroup);
  $("#clearRepertoire").addEventListener("click", () => {
    state.repertoire = [];
    writeJson(STORAGE_KEYS.repertoire, state.repertoire);
    renderRepertoire();
  });
  $("#saveGoogleConfig").addEventListener("click", saveGoogleConfig);
  $("#googleLogin").addEventListener("click", googleLogin);
  $("#googleLogout").addEventListener("click", googleLogout);
  $("#importFromSheet").addEventListener("click", importFromSheet);
  $("#syncLocalToSheet").addEventListener("click", syncLocalToSheet);
  $("#appendLocalToSheet").addEventListener("click", appendLocalToSheet);
}

function bindInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstall = event;
    $("#installBtn").hidden = false;
  });
  $("#installBtn").addEventListener("click", async () => {
    if (!state.deferredInstall) return;
    state.deferredInstall.prompt();
    await state.deferredInstall.userChoice;
    state.deferredInstall = null;
    $("#installBtn").hidden = true;
  });
}

function getFilters() {
  return Object.fromEntries(new FormData($("#searchForm")).entries());
}

function findMatches(filters = getFilters()) {
  const map = buildMapping();
  const query = normalize(filters.query);
  const terms = ["title", "artist", "songNumber", "category", "version"].map((key) => [key, normalize(filters[key])]);
  let results = state.songs.filter((item) => {
    const haystack = normalize([item.title, item.artist, item.songNumber, item.category, item.version, item.youtubeUrl, item.spotifyUrl].join(" "));
    if (filters.brand && item.brand !== filters.brand) return false;
    if (query && !haystack.includes(query)) return false;
    if (terms.some(([key, value]) => value && !normalize(item[key]).includes(value))) return false;
    if (filters.linkFilter === "youtube" && !item.youtubeUrl) return false;
    if (filters.linkFilter === "spotify" && !item.spotifyUrl) return false;
    if (filters.linkFilter === "missing" && (item.youtubeUrl || item.spotifyUrl)) return false;
    return true;
  });

  results = prioritizeBrand(results, filters.brand, map);
  return sortResults(results, filters.sortBy, map, query);
}

function prioritizeBrand(items, brand, mapping) {
  if (brand) return items;
  return [...items].sort((a, b) => {
    const aGroup = mapping.get(mappingKey(a)) || [];
    const bGroup = mapping.get(mappingKey(b)) || [];
    return bGroup.length - aGroup.length;
  });
}

function sortResults(items, sortBy, mapping, query) {
  return [...items].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title, "ko");
    if (sortBy === "artist") return a.artist.localeCompare(b.artist, "ko");
    if (sortBy === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
    if (sortBy === "brandCount") return (mapping.get(mappingKey(b))?.length || 0) - (mapping.get(mappingKey(a))?.length || 0);
    const scoreA = relevance(a, query);
    const scoreB = relevance(b, query);
    return scoreB - scoreA || a.title.localeCompare(b.title, "ko");
  });
}

function relevance(item, query) {
  if (!query) return 0;
  let score = 0;
  if (normalize(item.title).includes(query)) score += 5;
  if (normalize(item.artist).includes(query)) score += 3;
  if (normalize(item.songNumber).includes(query)) score += 4;
  return score;
}

function mappingKey(item) {
  return `${normalize(item.title)}::${normalize(item.artist)}`;
}

function buildMapping() {
  return state.songs.reduce((groups, item) => {
    const key = mappingKey(item);
    groups.set(key, [...(groups.get(key) || []), item]);
    return groups;
  }, new Map());
}

function renderAll() {
  renderSearchResults();
  renderLibrary();
  renderRepertoire();
  renderBookmarks();
  renderRecordings();
}

function renderSearchResults() {
  const results = findMatches();
  $("#resultSummary").textContent = `${results.length}곡 검색됨. 제목+가수 기준으로 태진/금영 번호 매핑 후보를 함께 표시합니다.`;
  renderSongList($("#results"), results);
}

function renderLibrary() {
  const category = $("#libraryCategory").value;
  const items = state.songs.filter((song) => song.category === category || (category === "인기추천" && ["K-POP", "트로트"].includes(song.category)));
  renderSongList($("#libraryList"), items);
}

function renderRepertoire() {
  const items = state.repertoire.map((id) => state.songs.find((song) => song.id === id)).filter(Boolean);
  const list = $("#repertoireList");
  if (!items.length) {
    list.innerHTML = `<div class="panel muted">아직 레파토리가 없습니다.</div>`;
    return;
  }
  renderSongList(list, items);
}

function renderBookmarks() {
  const root = $("#bookmarkGroups");
  root.innerHTML = "";
  state.bookmarks.forEach((group) => {
    const section = document.createElement("article");
    section.className = "group";
    const songs = group.songIds.map((id) => state.songs.find((song) => song.id === id)).filter(Boolean);
    section.innerHTML = `<h3>${escapeHtml(group.name)}</h3><p class="muted">${songs.length}곡</p>`;
    const list = document.createElement("div");
    list.className = "results";
    renderSongList(list, songs, false);
    section.append(list);
    root.append(section);
  });
}

function renderRecordings() {
  const root = $("#recordingList");
  if (!state.recordings.length) {
    root.innerHTML = `<div class="panel muted">저장된 녹음이 없습니다.</div>`;
    return;
  }
  root.innerHTML = state.recordings.map((item) => `
    <article class="song-card recording">
      <h3>${escapeHtml(item.name)}</h3>
      <p class="muted">${new Date(item.createdAt).toLocaleString()}</p>
      <audio controls src="${item.dataUrl}"></audio>
      <div class="card-actions">
        <a download="${escapeHtml(item.name)}.webm" href="${item.dataUrl}">다운로드</a>
        <button class="ghost" data-delete-recording="${item.id}">삭제</button>
      </div>
    </article>
  `).join("");
  $$("[data-delete-recording]").forEach((button) => button.addEventListener("click", () => {
    state.recordings = state.recordings.filter((item) => item.id !== button.dataset.deleteRecording);
    writeJson(STORAGE_KEYS.recordings, state.recordings);
    renderRecordings();
  }));
}

function renderSongList(root, items, withActions = true) {
  const mapping = buildMapping();
  root.innerHTML = "";
  if (!items.length) {
    root.innerHTML = `<div class="panel muted">조건에 맞는 곡이 없습니다.</div>`;
    return;
  }
  items.forEach((item) => {
    const card = $("#songCardTemplate").content.firstElementChild.cloneNode(true);
    $(".brand-chip", card).textContent = item.brand === "TJ" ? "태진 TJ" : "금영 KY";
    $(".brand-chip", card).classList.add(item.brand);
    $("h3", card).textContent = item.title;
    $(".artist", card).textContent = item.artist;
    $(".song-number", card).textContent = item.songNumber;
    $(".meta", card).textContent = `${item.category} · ${item.version || "반주"} · 수정 ${new Date(item.updatedAt).toLocaleDateString()}`;
    const related = (mapping.get(mappingKey(item)) || []).filter((song) => song.id !== item.id);
    $(".mapping", card).innerHTML = related.map((song) => `<span class="map-pill">${song.brand} ${escapeHtml(song.songNumber)} ${escapeHtml(song.version || "")}</span>`).join("");
    const youtube = $(".youtube", card);
    const spotify = $(".spotify", card);
    youtube.hidden = !item.youtubeUrl;
    spotify.hidden = !item.spotifyUrl;
    youtube.href = item.youtubeUrl || "#";
    spotify.href = item.spotifyUrl || "#";
    if (!withActions) {
      $(".card-actions", card).remove();
    } else {
      $(".add-repertoire", card).addEventListener("click", () => addToRepertoire(item.id));
      $(".bookmark", card).addEventListener("click", () => addToBookmark(item.id));
      $(".share", card).addEventListener("click", () => shareSong(item));
    }
    root.append(card);
  });
}

function addToRepertoire(id) {
  if (!state.repertoire.includes(id)) state.repertoire.unshift(id);
  writeJson(STORAGE_KEYS.repertoire, state.repertoire);
  renderRepertoire();
}

function addToBookmark(id) {
  const group = state.bookmarks[0] || { id: crypto.randomUUID(), name: "기본 시트", songIds: [] };
  if (!group.songIds.includes(id)) group.songIds.unshift(id);
  state.bookmarks[0] = group;
  writeJson(STORAGE_KEYS.bookmarks, state.bookmarks);
  renderBookmarks();
}

function addBookmarkGroup() {
  const input = $("#bookmarkGroupName");
  const name = input.value.trim();
  if (!name) return;
  state.bookmarks.push({ id: crypto.randomUUID(), name, songIds: [] });
  input.value = "";
  writeJson(STORAGE_KEYS.bookmarks, state.bookmarks);
  renderBookmarks();
}

async function shareSong(item) {
  const text = `${item.brand} ${item.songNumber} · ${item.title} - ${item.artist}`;
  if (navigator.share) {
    await navigator.share({ title: "노래질러", text });
  } else {
    await navigator.clipboard.writeText(text);
    alert("곡 정보가 클립보드에 복사되었습니다.");
  }
}

async function bindRecorder() {
  $("#recordBtn").addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.chunks = [];
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = (event) => state.chunks.push(event.data);
      state.mediaRecorder.onstop = saveRecording;
      state.mediaRecorder.start();
      $("#recordBtn").disabled = true;
      $("#stopRecordBtn").disabled = false;
      $("#recordState").textContent = "녹음 중";
    } catch {
      $("#recordState").textContent = "마이크 권한이 필요합니다.";
    }
  });
  $("#stopRecordBtn").addEventListener("click", () => {
    state.mediaRecorder?.stop();
    state.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    $("#recordBtn").disabled = false;
    $("#stopRecordBtn").disabled = true;
    $("#recordState").textContent = "저장 중";
  });
}

function saveRecording() {
  const blob = new Blob(state.chunks, { type: "audio/webm" });
  const reader = new FileReader();
  reader.onload = () => {
    state.recordings.unshift({
      id: crypto.randomUUID(),
      name: `recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`,
      createdAt: nowIso(),
      dataUrl: reader.result,
    });
    writeJson(STORAGE_KEYS.recordings, state.recordings);
    $("#recordState").textContent = "저장됨";
    renderRecordings();
  };
  reader.readAsDataURL(blob);
}

async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const imported = file.name.endsWith(".json") ? JSON.parse(text) : fromCsv(text);
  const stamped = imported.map((item) => ({
    id: item.id || crypto.randomUUID(),
    brand: normalizeBrand(item.brand || item["브랜드"]),
    title: item.title || item["노래제목"] || "",
    artist: item.artist || item["가수"] || "",
    songNumber: String(item.songNumber || item["노래번호"] || ""),
    category: item.category || item["분류"] || "인기추천",
    version: item.version || item["버전"] || "반주",
    createdAt: item.createdAt || item["등록일시"] || nowIso(),
    updatedAt: nowIso(),
    createdBy: item.createdBy || item["등록계정"] || "local",
    youtubeUrl: item.youtubeUrl || item["유튜브 링크"] || "",
    spotifyUrl: item.spotifyUrl || item["스포티파이 링크"] || "",
  })).filter((item) => item.brand && item.title && item.artist && item.songNumber);
  state.songs = mergeSongs(state.songs, stamped);
  writeJson(STORAGE_KEYS.songs, state.songs);
  event.target.value = "";
  renderAll();
}

function normalizeBrand(value) {
  const upper = String(value || "").toUpperCase();
  if (upper.includes("TJ") || upper.includes("태진")) return "TJ";
  if (upper.includes("KY") || upper.includes("금영")) return "KY";
  return "";
}

function mergeSongs(current, incoming) {
  const byKey = new Map(current.map((item) => [`${item.brand}:${item.songNumber}:${normalize(item.title)}:${normalize(item.artist)}`, item]));
  incoming.forEach((item) => byKey.set(`${item.brand}:${item.songNumber}:${normalize(item.title)}:${normalize(item.artist)}`, item));
  return [...byKey.values()];
}

function toCsv(rows) {
  const body = rows.map((row) => SHEET_HEADERS.map((key) => csvCell(row[key] || "")).join(","));
  return [SHEET_HEADERS.join(","), ...body].join("\n");
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function fromCsv(text) {
  const rows = parseCsv(text);
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((item) => item.some(Boolean));
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function restoreGoogleForm() {
  $("#googleClientId").value = state.google.clientId || "";
  $("#spreadsheetId").value = state.google.spreadsheetId || "";
  $("#sheetName").value = state.google.sheetName || "songs";
}

function saveGoogleConfig() {
  state.google = {
    clientId: $("#googleClientId").value.trim(),
    spreadsheetId: $("#spreadsheetId").value.trim(),
    sheetName: $("#sheetName").value.trim() || "songs",
  };
  writeJson(STORAGE_KEYS.google, state.google);
  $("#googleState").textContent = "구글 설정이 저장되었습니다.";
}

async function googleLogin() {
  saveGoogleConfig();
  try {
    await getGoogleAccessToken(true);
    $("#googleState").textContent = "구글 연결 완료. 이제 시트 가져오기와 업로드를 사용할 수 있습니다.";
  } catch (error) {
    $("#googleState").textContent = error.message;
  }
}

async function googleLogout() {
  if (state.googleAccessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(state.googleAccessToken);
  }
  state.googleAccessToken = "";
  state.googleTokenExpiresAt = 0;
  state.googleTokenClient = null;
  $("#googleState").textContent = "구글 연결을 해제했습니다.";
}

async function importFromSheet() {
  saveGoogleConfig();
  try {
    requireSheetConfig();
    $("#googleState").textContent = "시트에서 곡 목록을 가져오는 중입니다.";
    const response = await sheetsRequest("get");
    const imported = sheetRowsToSongs(response.values || []);
    if (!imported.length) {
      $("#googleState").textContent = "시트에서 가져올 곡이 없습니다. 헤더 행을 확인하세요.";
      return;
    }
    state.songs = mergeSongs(state.songs, imported);
    writeJson(STORAGE_KEYS.songs, state.songs);
    renderAll();
    $("#googleState").textContent = `${imported.length}곡을 시트에서 가져와 로컬 목록에 병합했습니다.`;
  } catch (error) {
    $("#googleState").textContent = `시트 가져오기 실패: ${error.message}`;
  }
}

async function syncLocalToSheet() {
  saveGoogleConfig();
  try {
    requireSheetConfig();
    $("#googleState").textContent = "로컬 곡 목록을 시트에 덮어쓰는 중입니다.";
    await sheetsRequest("update", [SHEET_HEADERS, ...state.songs.map(songToSheetRow)]);
    localStorage.setItem("singziller:lastSheetSyncPayload", JSON.stringify({
      spreadsheetId: state.google.spreadsheetId,
      sheetName: state.google.sheetName,
      exportedAt: nowIso(),
      songs: state.songs,
    }));
    $("#googleState").textContent = `${state.songs.length}곡을 시트에 덮어썼습니다.`;
  } catch (error) {
    $("#googleState").textContent = `시트 업로드 실패: ${error.message}`;
  }
}

async function appendLocalToSheet() {
  saveGoogleConfig();
  try {
    requireSheetConfig();
    $("#googleState").textContent = "현재 로컬 곡 목록을 시트 끝에 추가하는 중입니다.";
    await sheetsRequest("append", state.songs.map(songToSheetRow));
    $("#googleState").textContent = `${state.songs.length}곡을 시트 끝에 추가했습니다. 중복이 싫으면 전체 덮어쓰기를 사용하세요.`;
  } catch (error) {
    $("#googleState").textContent = `시트 추가 업로드 실패: ${error.message}`;
  }
}

function requireSheetConfig() {
  if (!navigator.onLine) throw new Error("오프라인에서는 Google Sheets를 사용할 수 없습니다.");
  if (!state.google.clientId) throw new Error("Google OAuth Client ID를 먼저 입력하세요.");
  if (!state.google.spreadsheetId) throw new Error("Spreadsheet ID를 입력하세요.");
  if (location.protocol === "file:") throw new Error("Google OAuth는 file://에서 동작하지 않습니다. localhost 또는 HTTPS로 열어주세요.");
}

async function sheetsRequest(operation, values) {
  const token = await getGoogleAccessToken(false);
  const url = sheetsValuesUrl(state.google.spreadsheetId, state.google.sheetName, operation);
  const options = {
    method: operation === "get" ? "GET" : operation === "append" ? "POST" : "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (operation !== "get") {
    options.body = JSON.stringify({
      majorDimension: "ROWS",
      values,
    });
  }
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function getGoogleAccessToken(interactive) {
  requireGoogleRuntime();
  if (state.googleAccessToken && Date.now() < state.googleTokenExpiresAt - 60000) {
    return state.googleAccessToken;
  }
  await loadGoogleIdentityScript();
  if (!state.googleTokenClient) {
    state.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: state.google.clientId,
      scope: GOOGLE_SHEETS_SCOPE,
      callback: () => {},
    });
  }
  return new Promise((resolve, reject) => {
    state.googleTokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      state.googleAccessToken = response.access_token;
      state.googleTokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
      resolve(state.googleAccessToken);
    };
    try {
      state.googleTokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
    } catch (error) {
      reject(error);
    }
  });
}

function requireGoogleRuntime() {
  if (!navigator.onLine) throw new Error("오프라인에서는 구글 로그인을 사용할 수 없습니다.");
  if (!state.google.clientId) throw new Error("Google OAuth Client ID를 먼저 입력하세요.");
  if (location.protocol === "file:") throw new Error("Google OAuth는 file://에서 동작하지 않습니다. localhost 또는 HTTPS로 열어주세요.");
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services 스크립트를 불러오지 못했습니다.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google Identity Services 스크립트를 불러오지 못했습니다."));
    document.head.append(script);
  });
}

function songToSheetRow(item) {
  return SHEET_HEADERS.map((key) => item[key] || "");
}

function sheetRowsToSongs(rows) {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) return [];
  const headers = headerRow.map((item) => String(item).trim());
  return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      brand: normalizeBrand(item.brand || item["브랜드"]),
      title: item.title || item["노래제목"] || "",
      artist: item.artist || item["가수"] || "",
      songNumber: String(item.songNumber || item["노래번호"] || ""),
      category: item.category || item["분류"] || "인기추천",
      version: item.version || item["버전"] || "반주",
      createdAt: item.createdAt || item["등록일시"] || nowIso(),
      updatedAt: item.updatedAt || item["수정일시"] || nowIso(),
      createdBy: item.createdBy || item["등록계정"] || "google",
      youtubeUrl: item.youtubeUrl || item["유튜브 링크"] || "",
      spotifyUrl: item.spotifyUrl || item["스포티파이 링크"] || "",
    }))
    .filter((item) => item.brand && item.title && item.artist && item.songNumber);
}

function sheetRange(sheetName, startCell = "") {
  const escapedName = String(sheetName || "songs").replace(/'/g, "''");
  return `'${escapedName}'!A${startCell}:K`;
}

function sheetsValuesUrl(spreadsheetId, sheetName, operation) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/`;
  if (operation === "update") {
    return `${base}${encodeURIComponent(sheetRange(sheetName, "1"))}?valueInputOption=RAW`;
  }
  if (operation === "append") {
    return `${base}${encodeURIComponent(sheetRange(sheetName))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  }
  return `${base}${encodeURIComponent(sheetRange(sheetName))}`;
}

function updateOnlineState() {
  const button = $("#onlineState");
  button.textContent = navigator.onLine ? "온라인" : "오프라인";
  button.classList.toggle("ghost", !navigator.onLine);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

Object.assign(globalThis, {
  SHEET_HEADERS,
  songToSheetRow,
  sheetRowsToSongs,
  sheetRange,
  sheetsValuesUrl,
});
