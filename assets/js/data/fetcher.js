// assets/js/fetcher.js

// --- FIXED CONFIG (as requested) ---
export const API_BASE_URL = 'http://localhost:3000/api';
export const DEVICE_ID = 'testtest';

const enc = encodeURIComponent;

// ---------- helpers ----------
async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    let json = null;
    try { json = await res.json(); } catch {}
    if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.body = json;
        throw err;
    }
    return json;
}

/** Safely build /api/fish/image/{imagePath} (supports already-prefixed or absolute URLs) */
export function encodeImagePath(raw) {
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;

    const base = API_BASE_URL.replace(/\/+$/, '');
    if (raw.startsWith('/api/fish/image/')) {
        // normalize to this API base
        return `${base}${raw.replace(/^\/api/, '')}`;
    }
    // "deviceId/filename.jpg" -> encode each segment
    return `${base}/fish/image/` + raw.split('/').map(enc).join('/');
}

/** Normalize fish list payload from GET /fish/:deviceId */
function normalizeFishList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
}

/** Map backend entry to a UI-friendly card shape (keep original in .raw) */
function toUiCard(entry) {
    const fish = entry.fish && typeof entry.fish === 'object' ? entry.fish : entry;
    const imageRaw = entry.imageUrl || fish.imageUrl || '';
    return {
        id: entry.fishId || fish._id || entry._id || '',
        name: fish.name || 'Unknown',
        family: fish.family || '',
        waterType: fish.waterType || '',
        region: fish.region || '',
        environment: fish.environment || '',
        conservationStatus: fish.conservationStatus || '',
        minSize: fish.minSize ?? null,
        maxSize: fish.maxSize ?? null,
        depthRangeMin: fish.depthRangeMin ?? null,
        depthRangeMax: fish.depthRangeMax ?? null,
        aiAccuracy: fish.aiAccuracy ?? null,
        createdAt: fish.createdAt || entry.timestamp || entry.createdAt || '',
        imageUrl: imageRaw ? encodeImagePath(imageRaw) : '',
        raw: entry
    };
}

/** Pretty “x ago” helper (optional for UI) */
export function formatTimestamp(ts) {
    if (!ts) return 'Unknown';
    const now = new Date();
    const d = new Date(ts);
    const diff = now - d;
    if (diff < 0) return d.toLocaleString();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------- DEVICE ENDPOINTS ----------
/** POST /device/register  body: { deviceId } */
export async function registerDevice(deviceId = DEVICE_ID) {
    const url = `${API_BASE_URL}/device/register`;
    return fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
    });
}

/** GET /device/:id */
export async function getDevice(deviceId = DEVICE_ID) {
    const url = `${API_BASE_URL}/device/${enc(deviceId)}`;
    return fetchJSON(url, { method: 'GET' });
}

// ---------- FISH ENDPOINTS ----------
/** GET /fish/:deviceId -> array normalized to UI cards */
export async function getFishByDevice(deviceId = DEVICE_ID) {
    const url = `${API_BASE_URL}/fish/${enc(deviceId)}`;
    const payload = await fetchJSON(url, { method: 'GET' });
    const list = normalizeFishList(payload);
    return list.map(toUiCard);
}

/** Convenience: latest N cards from device list */
export async function getRecentCatches(limit = 6, deviceId = DEVICE_ID) {
    const all = await getFishByDevice(deviceId);
    const sorted = [...all].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
    });
    return sorted.slice(0, limit);
}

/** GET /fish/name/:fishName  -> check by name */
export async function checkFishByName(fishName) {
    const url = `${API_BASE_URL}/fish/name/${enc(fishName)}`;
    return fetchJSON(url, { method: 'GET' });
}

/** POST /fish/add-existing/:deviceId/:fishName  body: { imageUrl } */
export async function addExistingFishToDevice(deviceId, fishName, imageUrl) {
    const url = `${API_BASE_URL}/fish/add-existing/${enc(deviceId)}/${enc(fishName)}`;
    return fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
    });
}

/** POST /fish/upload  (multipart: deviceId + file) */
export async function identifyFish(imageFile, deviceId = DEVICE_ID) {
    const url = `${API_BASE_URL}/fish/upload`;
    const fd = new FormData();
    fd.append('deviceId', deviceId);
    fd.append('file', imageFile, imageFile.name || 'upload.jpg');

    // Don't set Content-Type for FormData — browser handles it
    const res = await fetch(url, { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        const err = new Error(`Upload failed: ${msg}`);
        err.status = res.status;
        err.body = json;
        throw err;
    }
    return json; // { success, message, deviceId, fileMeta, fish: {...} }
}

/** Helper: derive a single fish entry by ID from the device list */
export async function getCatchDetails(fishId, deviceId = DEVICE_ID) {
    const all = await getFishByDevice(deviceId);
    return all.find(x => String(x.id) === String(fishId)) || null;
}

/** Alias for details page parity */
export async function getFishDetails(fishId, deviceId = DEVICE_ID) {
    return getCatchDetails(fishId, deviceId);
}

// ---------- CHAT ----------
/** POST /chat/:deviceId  body: { message } */
export async function sendChatMessage(message, deviceId = DEVICE_ID) {
    const url = `${API_BASE_URL}/chat/${enc(deviceId)}`;
    return fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
}

// ---------- DEFAULT EXPORT ----------
export default {
    API_BASE_URL,
    DEVICE_ID,
    encodeImagePath,
    formatTimestamp,

    // Device
    registerDevice,
    getDevice,

    // Fish
    getFishByDevice,
    getRecentCatches,
    checkFishByName,
    addExistingFishToDevice,
    identifyFish,
    getCatchDetails,
    getFishDetails,

    // Chat
    sendChatMessage,
};
