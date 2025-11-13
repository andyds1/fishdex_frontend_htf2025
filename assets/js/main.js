// Router - Just Plain JS Works - Who needs Express or some fancy React stuff anyways

const pageModules = {
    'index.html': () => import('./pages/home.js'),
    'upload.html': () => import('./pages/upload.js'),
    'chat.html': () => import('./pages/chat.js'),
    'gallery.html': () => import('./pages/gallery.js'),
    'details.html': () => import('./pages/details.js')
};

async function initApp() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const loader = pageModules[currentPage];
    if (loader) {
        try {
            const module = await loader();
            
            if (module.goBack) window.goBack = module.goBack;
            if (module.goToUpload) window.goToUpload = module.goToUpload;
            if (module.goToChat) window.goToChat = module.goToChat;
            if (module.goToGallery) window.goToGallery = module.goToGallery;
            if (module.handleUpload) window.handleUpload = module.handleUpload;
            if (module.sendMessage) window.sendMessage = module.sendMessage;
            if (module.handleKeyPress) window.handleKeyPress = module.handleKeyPress;
            
            if (module.init) {
                await module.init();
            }
        } catch (error) {
            console.error('Failed to load page module:', error);
        }
    }
}

// Fallback
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
