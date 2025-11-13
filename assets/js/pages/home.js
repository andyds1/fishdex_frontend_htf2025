import { getRecentCatches, getCatchDetails } from '../data/fetcher.js';

export function goToUpload() {
    window.location.href = 'upload.html';
}

export function goToChat() {
    window.location.href = 'chat.html';
}

export function goToGallery(e) {
    e?.preventDefault();
    window.location.href = 'gallery.html';
}

function renderCatches(catches) {
    const grid = document.getElementById('fishGrid');
    if (!grid) return;
    
    grid.innerHTML = catches.map(fish => `
        <div class="fish-card" data-id="${fish.id}">
            <img src="${fish.image}" alt="${fish.name}">
            <div class="fish-info">
                <div class="fish-name">${fish.name}</div>
                <div class="fish-time">${fish.time}</div>
            </div>
        </div>
    `).join('');
    
    grid.querySelectorAll('.fish-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            viewDetails(id);
        });
    });
}

async function viewDetails(id) {
    const fish = await getCatchDetails(id);
    alert(`${fish.name}\nID: ${fish.id}`);
}

// Initialize home page
export async function init() {
    const catches = await getRecentCatches();
    renderCatches(catches);
}
