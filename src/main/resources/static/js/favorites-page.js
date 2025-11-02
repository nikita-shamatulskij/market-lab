// favorites-page.js - Загрузка и отображение избранных товаров
class FavoritesPageManager {
    constructor() {
        this.favoritesGrid = document.getElementById('favoritesGrid');
        this.emptyFavorites = document.getElementById('emptyFavorites');
        this.init();
    }

    async init() {
        console.log('🎯 FavoritesPageManager initialized');

        // Даем время для инициализации auth.js и восстановления профиля
        await new Promise(resolve => setTimeout(resolve, 500));

        const token = this.getToken();
        const userData = localStorage.getItem('userData');

        console.log('🔍 Auth check - Token:', token ? 'present' : 'missing', 'UserData:', userData ? 'present' : 'missing');

        if (!token) {
            console.log('❌ No token available, showing login prompt');
            this.showLoginPrompt();
            return;
        }

        await this.loadFavorites();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Слушаем клики на кнопки удаления
        this.favoritesGrid?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-favorite-btn');
            if (removeBtn) {
                const productId = removeBtn.dataset.productId;
                this.removeFromFavorites(productId);
            }
        });

        // Слушаем изменения в localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'userFavorites') {
                this.loadFavorites();
            }
        });
    }

    async removeFromFavorites(productId) {
        const token = this.getToken();

        if (!token) {
            console.log('❌ No token available for removal');
            this.showLoginPrompt();
            return;
        }

        try {
            console.log('🗑️ Removing product from favorites:', productId);

            const response = await fetch(`/api/favorites/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                console.log('✅ Product removed from favorites');

                // Удаляем карточку из DOM
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.remove();
                }

                // Проверяем, остались ли еще товары
                const remainingProducts = this.favoritesGrid?.querySelectorAll('.product-card');
                if (!remainingProducts || remainingProducts.length === 0) {
                    this.showEmptyFavorites();
                }

                // Обновляем глобальный список избранного
                this.updateGlobalFavoritesList(productId, 'remove');

                // Показываем уведомление
                this.showNotification('Товар удален из избранного', 'success');

            } else {
                const errorText = await response.text();
                console.error('❌ Error removing favorite:', response.status, errorText);
                this.showNotification('Ошибка при удалении из избранного', 'error');
            }

        } catch (error) {
            console.error('❌ Error removing favorite:', error);
            this.showNotification('Не удалось удалить товар из избранного', 'error');
        }
    }

    updateGlobalFavoritesList(productId, action) {
        // Обновляем localStorage
        const currentFavorites = JSON.parse(localStorage.getItem('userFavorites') || '[]');
        const updatedFavorites = currentFavorites.filter(id => id !== parseInt(productId));
        localStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));

        // Обновляем счетчик в шапке
        this.updateFavoritesCounter(updatedFavorites.length);

        console.log('✅ Favorites updated. Remaining:', updatedFavorites.length);
    }

    updateFavoritesCounter(count) {
        // Обновляем счетчик в шапке сайта
        const counterElements = document.querySelectorAll('.favorites-count, .favorites-counter');
        counterElements.forEach(element => {
            element.textContent = count;
        });
    }

    async loadFavorites() {
        const token = this.getToken();

        if (!token) {
            console.log('❌ No token, showing login prompt');
            this.showLoginPrompt();
            return;
        }

        // Логируем информацию о токене (безопасно)
        console.log('🔑 Token present, length:', token.length);
        console.log('🔑 Token starts with:', token.substring(0, 10) + '...');
        console.log('🔑 Token ends with:', '...' + token.substring(token.length - 10));

        // Проверяем формат токена (JWT обычно имеет 3 части, разделенные точками)
        const tokenParts = token.split('.');
        console.log('🔑 Token parts count:', tokenParts.length);
        if (tokenParts.length !== 3) {
            console.error('❌ Invalid JWT format! Expected 3 parts separated by dots, got:', tokenParts.length);
            this.showError('Неверный формат токена. Пожалуйста, войдите заново.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            this.showLoginPrompt();
            return;
        }

        try {
            console.log('📥 Loading favorites from API...');
            console.log('📤 Request URL: /api/favorites/products');

            const response = await fetch('/api/favorites/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            console.log('📥 Response status:', response.status);

            if (response.status === 401) {
                console.log('❌ Unauthorized (401), token may be expired or invalid');

                // Очищаем невалидный токен
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');

                // Показываем сообщение об ошибке и предложение войти заново
                this.showError('Ваша сессия истекла. Пожалуйста, войдите заново.');
                setTimeout(() => {
                    this.showLoginPrompt();
                }, 2000);
                return;
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('❌ Response not OK:', response.status, errorText);
                this.showError(`Ошибка загрузки: ${response.status}. Попробуйте обновить страницу.`);
                return;
            }

            const products = await response.json();
            console.log('⭐ Loaded favorites:', products);

            if (!products || products.length === 0) {
                this.showEmptyFavorites();
            } else {
                this.renderFavorites(products);
                // Сохраняем IDs в localStorage для синхронизации
                const productIds = products.map(p => p.id);
                localStorage.setItem('userFavorites', JSON.stringify(productIds));
                this.updateFavoritesCounter(productIds.length);
            }

        } catch (error) {
            console.error('❌ Error loading favorites:', error);
            this.showError('Не удалось загрузить избранные товары. Попробуйте обновить страницу.');
        }
    }

    renderFavorites(products) {
        if (!this.favoritesGrid) return;

        this.favoritesGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.emptyFavorites.classList.add('hidden');

        // Инициализируем менеджер избранного для кнопок на этой странице
        if (window.favoritesManager) {
            setTimeout(() => {
                window.favoritesManager.updateAllFavoriteButtons(products.map(p => p.id));
            }, 100);
        }
    }

    createProductCard(product) {
        const imageUrl = product.imageUrl || `https://picsum.photos/300/200?random=${product.id}`;
        const price = this.formatPrice(product.price);

        return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-card-inner">
                <a href="/product/${product.id}" class="product-link">
                    <div class="product-image">
                        <img src="${this.escapeHtml(imageUrl)}" 
                             alt="${this.escapeHtml(product.name)}"
                             onerror="this.src='https://picsum.photos/300/200?random=${product.id}'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                        <div class="product-price">${price} ₽</div>
                        ${product.description ? `<p class="product-description">${this.escapeHtml(product.description)}</p>` : ''}
                    </div>
                </a>
                <div class="product-actions">
                    <!-- КНОПКА УДАЛЕНИЯ ИЗ ИЗБРАННОГО -->
                    <button class="action-btn remove-favorite-btn" 
                            type="button"
                            data-product-id="${product.id}"
                            title="Удалить из избранного">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 6h18l-2 14H5L3 6zm4-4h10v2H7V2z"/>
                        </svg>
                    </button>
                    
                    <!-- Кнопка корзины -->
                    <button class="action-btn cart-btn" type="button" title="Добавить в корзину">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" 
                                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 4px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        document.body.appendChild(notification);

        // Автоматически удаляем через 3 секунды
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    showEmptyFavorites() {
        if (this.favoritesGrid) {
            this.favoritesGrid.innerHTML = '';
        }
        if (this.emptyFavorites) {
            this.emptyFavorites.classList.remove('hidden');
        }
        this.updateFavoritesCounter(0);
    }

    showLoginPrompt() {
        if (this.favoritesGrid) {
            this.favoritesGrid.innerHTML = `
                <div class="login-prompt" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h2>Войдите, чтобы увидеть избранное</h2>
                    <p>Для просмотра избранных товаров необходимо авторизоваться</p>
                    <button class="btn-primary" onclick="document.getElementById('loginButton')?.click()">
                        Войти
                    </button>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.favoritesGrid) {
            this.favoritesGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #dc3545;">
                    <h3>❌ Ошибка</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <button class="btn-primary" onclick="location.reload()">Обновить страницу</button>
                </div>
            `;
        }
    }

    formatPrice(price) {
        if (!price) return '0';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toLocaleString('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getToken() {
        let token = localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('authToken') ||
            sessionStorage.getItem('token');

        if (!token || token === 'null' || token === 'undefined' || token === '' || token.length < 10) {
            return null;
        }

        // Убираем возможные лишние кавычки
        if ((token.startsWith('"') && token.endsWith('"')) ||
            (token.startsWith("'") && token.endsWith("'"))) {
            token = token.slice(1, -1);
        }

        // Убираем возможные пробелы
        token = token.trim();

        return token;
    }
}

// Инициализация при загрузке страницы
function initFavoritesPage() {
    setTimeout(() => {
        if (!window.favoritesPageManager) {
            window.favoritesPageManager = new FavoritesPageManager();
        }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFavoritesPage);
} else {
    initFavoritesPage();
}