// favorites.js - Complete Favorites Management System
class FavoritesManager {
    constructor() {
        console.log('🎯 FavoritesManager initialized');
        this.isInitialized = false;
        this.isLoading = false;
        this.favoriteIds = new Set();
        this.init();
    }

    init() {
        if (this.isInitialized) {
            console.log('🔄 Reinitializing favorites manager');
        }

        this.setupEventListeners();
        this.loadFavorites();
        this.isInitialized = true;

        // Listen for auth state changes
        this.setupAuthListeners();
    }

    setupEventListeners() {
        // Remove old handlers to prevent duplicates
        document.removeEventListener('click', this.handleDocumentClick);

        // Bind and add new handler
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.handleDocumentClick);

        // Listen for custom auth events
        document.addEventListener('authSuccess', this.handleAuthSuccess.bind(this));
        document.addEventListener('logout', this.handleLogout.bind(this));
    }

    setupAuthListeners() {
        // Monitor localStorage for token changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'token') {
                if (e.newValue) {
                    this.handleAuthSuccess();
                } else {
                    this.handleLogout();
                }
            }
        });
    }

    handleAuthSuccess() {
        console.log('🔐 Auth success detected, reloading favorites');
        setTimeout(() => {
            this.loadFavorites();
        }, 300);
    }

    handleLogout() {
        console.log('🚪 Logout detected, clearing favorites');
        this.favoriteIds.clear();
        this.updateAllFavoriteButtons([]);
        localStorage.removeItem('userFavorites');
    }

    handleDocumentClick(e) {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.preventDefault();
            e.stopPropagation();

            const productId = favoriteBtn.dataset.productId;
            console.log('❤️ Favorite button clicked, product:', productId);
            this.toggleFavorite(productId, favoriteBtn);
        }
    }

    async toggleFavorite(productId, buttonElement) {
        if (this.isLoading) {
            console.log('⏳ Operation in progress, please wait');
            return;
        }

        try {
            console.log('🔄 Toggle favorite for product:', productId);

            const token = this.getToken();
            console.log('🔑 Token available:', !!token);

            if (!token) {
                console.log('❌ No token, showing auth modal');
                this.showAuthModal();
                return;
            }

            console.log('✅ User is authenticated, proceeding...');
            const isCurrentlyFavorite = buttonElement.classList.contains('active');

            if (isCurrentlyFavorite) {
                await this.removeFavorite(productId, buttonElement);
            } else {
                await this.addFavorite(productId, buttonElement);
            }

        } catch (error) {
            console.error('❌ Favorite error:', error);
            this.showError('Ошибка: ' + error.message);
        }
    }

    //извление токена
    getToken() {
        let token = localStorage.getItem('authToken');
        if (!token || token === 'null' || token === 'undefined' || token === '' || token.length < 10) {
            console.log('❌ Token invalid or missing');
            return null;
        }
        console.log('✅ Token is valid');
        return token;
    }


    async addFavorite(productId, buttonElement) {
        const token = this.getToken();
        if (!token) {
            this.showAuthModal();
            return;
        }

        this.isLoading = true;
        this.showLoader(buttonElement);

        try {
            console.log('📤 Adding to favorites...', 'Product ID:', productId, 'Token:', token ? '✅ Present' : '❌ Missing');
            const response = await fetch(`/api/favorites/add/${productId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Add favorite response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', response.status, errorText);
                
                // Если ошибка 401, возможно токен истек или невалиден
                if (response.status === 401) {
                    // Пробуем проверить токен и обновить его
                    const currentToken = this.getToken();
                    if (!currentToken) {
                        this.showAuthModal();
                        throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
                    } else {
                        throw new Error('Ошибка авторизации. Пожалуйста, перезайдите в систему.');
                    }
                }
                
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            this.favoriteIds.add(parseInt(productId));
            this.updateButtonState(buttonElement, true);
            this.showSuccess('Товар добавлен в избранное');
            this.addToLocalFavorites(productId);

        } catch (error) {
            console.error('❌ Add favorite failed:', error);

            // If server error, check if product is already in local favorites
            if (this.isProductInLocalFavorites(productId)) {
                this.updateButtonState(buttonElement, true);
                this.showSuccess('Товар уже в избранном');
            } else {
                throw error;
            }
        } finally {
            this.isLoading = false;
            this.hideLoader(buttonElement);
        }
    }

    async removeFavorite(productId, buttonElement) {
        const token = this.getToken();
        if (!token) {
            this.showAuthModal();
            return;
        }

        this.isLoading = true;
        this.showLoader(buttonElement);

        try {
            console.log('🗑️ Removing from favorites...');
            const response = await fetch(`/api/favorites/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Remove favorite response:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.favoriteIds.delete(parseInt(productId));
            this.updateButtonState(buttonElement, false);
            this.showSuccess('Товар удален из избранного');
            this.removeFromLocalFavorites(productId);

        } catch (error) {
            console.error('❌ Remove favorite failed:', error);

            // If server error, remove from local state anyway
            this.favoriteIds.delete(parseInt(productId));
            this.updateButtonState(buttonElement, false);
            this.removeFromLocalFavorites(productId);
            this.showSuccess('Товар удален из избранного');
        } finally {
            this.isLoading = false;
            this.hideLoader(buttonElement);
        }
    }

    updateButtonState(buttonElement, isFavorite) {
        if (!buttonElement) return;

        if (isFavorite) {
            buttonElement.classList.add('active');
            buttonElement.style.color = '#dc3545';
            buttonElement.title = 'Удалить из избранного';
            buttonElement.setAttribute('aria-pressed', 'true');

            // Update heart icon
            this.updateHeartIcon(buttonElement, true);
        } else {
            buttonElement.classList.remove('active');
            buttonElement.style.color = '';
            buttonElement.title = 'Добавить в избранное';
            buttonElement.setAttribute('aria-pressed', 'false');

            // Update heart icon
            this.updateHeartIcon(buttonElement, false);
        }
    }

    updateHeartIcon(buttonElement, isFilled) {
        const svg = buttonElement.querySelector('svg');
        const path = buttonElement.querySelector('path');

        if (isFilled) {
            // Filled heart
            if (path) {
                path.style.fill = '#dc3545';
                path.style.stroke = '#dc3545';
            }
        } else {
            // Outline heart
            if (path) {
                path.style.fill = 'none';
                path.style.stroke = 'currentColor';
            }
        }
    }

    async loadFavorites() {
        const token = this.getToken();
        if (!token) {
            console.log('🔒 No token, loading local favorites only');
            this.loadLocalFavorites();
            return;
        }

        try {
            console.log('📥 Loading favorites from API...');
            const response = await fetch('/api/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const favoriteIds = await response.json();
                console.log('⭐ Loaded favorites from API:', favoriteIds);

                this.favoriteIds = new Set(favoriteIds.map(id => parseInt(id)));
                this.updateAllFavoriteButtons(favoriteIds);
                this.saveLocalFavorites(favoriteIds);
            } else {
                console.log('❌ Failed to load favorites from API, using local storage');
                this.loadLocalFavorites();
            }
        } catch (error) {
            console.error('❌ Error loading favorites from API:', error);
            this.loadLocalFavorites();
        }
    }

    loadLocalFavorites() {
        try {
            const localFavorites = this.getLocalFavorites();
            console.log('📚 Loaded local favorites:', localFavorites);

            this.favoriteIds = new Set(localFavorites.map(id => parseInt(id)));
            this.updateAllFavoriteButtons(localFavorites);
        } catch (error) {
            console.error('❌ Error loading local favorites:', error);
            this.favoriteIds = new Set();
        }
    }

    updateAllFavoriteButtons(favoriteIds) {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        console.log('🔄 Updating', favoriteButtons.length, 'favorite buttons');

        favoriteButtons.forEach(button => {
            const productId = button.dataset.productId;
            if (productId) {
                const isFavorite = favoriteIds.includes(parseInt(productId));
                this.updateButtonState(button, isFavorite);
            }
        });
    }

    // Method to call after login
    reinitializeAfterLogin() {
        console.log('🎉 Reinitializing favorites after login');

        // Clear any existing timeouts
        if (this.reinitTimeout) {
            clearTimeout(this.reinitTimeout);
        }

        this.reinitTimeout = setTimeout(() => {
            const token = this.getToken();
            console.log('🔑 Token after login:', token ? '✅ Available' : '❌ Missing');

            if (token) {
                this.loadFavorites();
                // Re-bind event listeners for any new DOM elements
                this.setupEventListeners();
            }
        }, 500);
    }

    // Force refresh favorites from server
    async refreshFavorites() {
        console.log('🔄 Force refreshing favorites from server');
        await this.loadFavorites();
    }

    // Check if product is in favorites
    isFavorite(productId) {
        return this.favoriteIds.has(parseInt(productId));
    }

    // Get all favorite IDs
    getFavorites() {
        return Array.from(this.favoriteIds);
    }

    // Local storage methods
    getLocalFavorites() {
        try {
            const favorites = localStorage.getItem('userFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('❌ Error reading local favorites:', error);
            return [];
        }
    }

    saveLocalFavorites(favoriteIds) {
        try {
            localStorage.setItem('userFavorites', JSON.stringify(favoriteIds));
            console.log('💾 Saved favorites to local storage:', favoriteIds.length, 'items');
        } catch (error) {
            console.error('❌ Error saving local favorites:', error);
        }
    }

    addToLocalFavorites(productId) {
        const favorites = this.getLocalFavorites();
        const productIdNum = parseInt(productId);

        if (!favorites.includes(productIdNum)) {
            favorites.push(productIdNum);
            this.saveLocalFavorites(favorites);
        }
    }

    removeFromLocalFavorites(productId) {
        const favorites = this.getLocalFavorites();
        const productIdNum = parseInt(productId);
        const updatedFavorites = favorites.filter(id => id !== productIdNum);
        this.saveLocalFavorites(updatedFavorites);
    }

    isProductInLocalFavorites(productId) {
        const favorites = this.getLocalFavorites();
        return favorites.includes(parseInt(productId));
    }

    // UI methods
    showAuthModal() {
        console.log('🔐 Showing auth modal');
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
            loginModal.classList.add('show');
        } else {
            // Fallback alert
            if (confirm('Для добавления в избранное необходимо войти в систему. Перейти к авторизации?')) {
                window.location.href = '/auth';
            }
        }
    }

    showLoader(buttonElement) {
        if (!buttonElement) return;

        const originalHTML = buttonElement.innerHTML;
        buttonElement.setAttribute('data-original-html', originalHTML);
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
        buttonElement.style.opacity = '0.6';
        buttonElement.style.pointerEvents = 'none';
    }

    hideLoader(buttonElement) {
        if (!buttonElement) return;

        const originalHTML = buttonElement.getAttribute('data-original-html');
        if (originalHTML) {
            buttonElement.innerHTML = originalHTML;
        }
        buttonElement.style.opacity = '1';
        buttonElement.style.pointerEvents = 'auto';
    }

    showSuccess(message) {
        console.log('✅', message);
        this.showToast(message, 'success');
    }

    showError(message) {
        console.error('❌', message);
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `favorites-toast favorites-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        // Add styles
        if (!document.querySelector('#favorites-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'favorites-toast-styles';
            styles.textContent = `
                .favorites-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-left: 4px solid #28a745;
                    padding: 12px 16px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 300px;
                    animation: slideInRight 0.3s ease;
                }
                .favorites-toast-error {
                    border-left-color: #dc3545;
                }
                .favorites-toast .toast-content {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                }
                .favorites-toast .toast-message {
                    flex: 1;
                    margin-right: 10px;
                }
                .favorites-toast .toast-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('authSuccess', this.handleAuthSuccess);
        document.removeEventListener('logout', this.handleLogout);

        if (this.reinitTimeout) {
            clearTimeout(this.reinitTimeout);
        }

        console.log('🧹 FavoritesManager destroyed');
    }
}

// Initialize favorites manager
console.log('🚀 Starting favorites manager...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.favoritesManager = new FavoritesManager();
    });
} else {
    window.favoritesManager = new FavoritesManager();
}

// Global functions for external access
window.reinitializeFavorites = function() {
    console.log('🔄 Manual favorites reinitialization called');
    if (window.favoritesManager) {
        window.favoritesManager.reinitializeAfterLogin();
    }
};

window.refreshFavorites = function() {
    console.log('🔄 Manual favorites refresh called');
    if (window.favoritesManager) {
        window.favoritesManager.refreshFavorites();
    }
};

window.getUserFavorites = function() {
    if (window.favoritesManager) {
        return window.favoritesManager.getFavorites();
    }
    return [];
};

window.isProductFavorite = function(productId) {
    if (window.favoritesManager) {
        return window.favoritesManager.isFavorite(productId);
    }
    return false;
};

console.log('🎯 Favorites manager ready!');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesManager;
}