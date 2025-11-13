import {getFishByDevice} from '../data/fetcher.js';

export function goBack() {
    window.location.href = 'index.html';
}

async function viewFishDetails(id) {
    window.location.href = `details.html?id=${id}`;
}

export async function init() {
    const catches = await getFishByDevice();
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!catches || catches.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🐠</div>
                <div class="empty-state-text">No fish caught yet</div>
                <div class="empty-state-subtext">Start identifying fish to build your collection!</div>
            </div>
        `;
        return;
    }

    document.getElementById('totalCatches').textContent = catches.length;
    
    const uniqueSpecies = new Set(catches.map(c => c.name)).size;
    document.getElementById('uniqueSpecies').textContent = uniqueSpecies;

    galleryGrid.innerHTML = catches.map((fish, index) => `
        <div class="fish-card" data-id="${fish.id}">
            <img class="fish-card-image" src="${fish.image}" alt="${fish.name}">
            <div class="fish-card-info">
                <div class="fish-card-name">${fish.name}</div>
                <div class="fish-card-number">#${String(index + 1).padStart(3, '0')} · ${fish.time}</div>
            </div>
        </div>
    `).join('');
    
    galleryGrid.querySelectorAll('.fish-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            viewFishDetails(id);
        });
    });
}
