// assets/js/pages/details.js
// Hardcode device here per your setup
const API_BASE_URL = 'http://localhost:3000/api';
const DEVICE_ID = 'testtest';

const $ = (id) => document.getElementById(id);
const enc = encodeURIComponent;

function formatDate(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} - ${t || res.statusText}`);
    }
    return res.json();
}

function findByAnyId(arr, wantId) {
    if (!wantId) return null;
    const id = String(wantId);
    return arr.find(it => {
        const a = it?._id ? String(it._id) : null;
        const b = it?.fishId ? String(it.fishId) : null;
        const c = it?.fish?._id ? String(it.fish._id) : null;
        return a === id || b === id || c === id;
    }) || null;
}

function safeText(elId, value, fallback = '-') {
    const el = $(elId);
    if (el) el.textContent = (value ?? value === 0) ? String(value) : fallback;
}

export async function init() {
    // read ?id=...
    const params = new URLSearchParams(window.location.search);
    const fishId = params.get('id');

    if (!fishId) {
        alert('No fish ID provided');
        window.location.href = 'index.html';
        return;
    }

    try {
        // fetch all sightings for device
        const url = `${API_BASE_URL}/fish/${enc(DEVICE_ID)}`;
        const payload = await fetchJSON(url);

        const list = Array.isArray(payload?.data) ? payload.data : [];
        if (list.length === 0) {
            alert('No fish found for this device');
            window.location.href = 'index.html';
            return;
        }

        // try to find matching entry
        const item = findByAnyId(list, fishId);
        if (!item) {
            alert('Fish not found');
            window.location.href = 'index.html';
            return;
        }

        const fish = item.fish || {};
        const imageUrl = item.imageUrl || '';
        const capturedDate = item.timestamp || fish.captureTimestamp;

        // Image
        const img = $('fishImage');
        if (img) img.src = imageUrl || '';

        // Basic info
        safeText('fishName', fish.name, 'Unknown Fish');
        safeText('family', fish.family);
        safeText('waterType', fish.waterType);

        // Size range
        const sizeRange =
            (fish.minSize != null || fish.maxSize != null)
                ? `${fish.minSize ?? ''}${fish.minSize != null ? '-' : ''}${fish.maxSize ?? ''}cm`
                : '-';
        safeText('sizeRange', sizeRange);

        // Depth range
        const depthRange =
            (fish.depthRangeMin != null || fish.depthRangeMax != null)
                ? `${fish.depthRangeMin ?? ''}${fish.depthRangeMin != null ? '-' : ''}${fish.depthRangeMax ?? ''}m`
                : '-';
        safeText('depthRange', depthRange);

        safeText('environment', fish.environment);
        safeText('region', fish.region);
        safeText('conservation', fish.conservationStatus);

        // AI Accuracy
        const accuracy = (fish.aiAccuracy != null) ? `${fish.aiAccuracy}%` : '-';
        safeText('aiAccuracy', accuracy);

        // Captured date
        safeText('captured', formatDate(capturedDate));

        // Descriptions
        safeText('description', fish.description, 'No description available.');
        safeText('colorDescription', fish.colorDescription, 'No appearance description available.');

        // Conservation status description
        const consStatusDesc = fish.consStatusDescription || fish.conservationStatus;
        const consEl = $('consStatusDescription');
        const consSection = $('conservationSection');
        if (consEl && consStatusDesc) {
            consEl.textContent = consStatusDesc;
        } else if (consSection) {
            consSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load fish details:', error);
        alert('Failed to load fish details');
        window.location.href = 'index.html';
    }
}

export function goBack() {
    window.location.href = 'index.html';
}
