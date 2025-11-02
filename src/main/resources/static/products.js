// products.js - Modern Products Manager
class ProductsManager {
    constructor() {
        this.products = [];
        this.container = document.getElementById('productsGrid');
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error('❌ Products grid container not found!');
            return;
        }

        this.showLoading();
        await this.loadProducts();
        this.render();
        this.setupEventListeners();
    }

    async loadProducts() {
        try {
            console.log('🔄 Loading products from BFF...');

            const response = await fetch('http://localhost:8083/api/products');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.products = await response.json();
            console.log('✅ Products loaded:', this.products);

        } catch (error) {
            console.error('❌ Failed to load products:', error);
            this.showError(`Ошибка загрузки: ${error.message}`);
        }
    }

    render() {
        if (this.products.length === 0) {
            this.showEmpty();
            return;
        }

        this.container.innerHTML = this.products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${this.getProductImage(product)}" 
                         alt="${product.name}" 
                         class="product-img"
                         loading="lazy"
                         onerror="this.src='https://picsum.photos/300/200?random=${product.id}'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                    <p class="product-seller">${this.escapeHtml(product.sellerName || 'MarketLab')}</p>

                    <div class="product-actions">
                        <button class="action-btn wishlist-btn" 
                                data-product-id="${product.id}"
                                title="Добавить в избранное">
                            ♥
                        </button>
                        <button class="action-btn cart-btn" 
                                data-product-id="${product.id}"
                                title="Добавить в корзину">
                            🛒
                        </button>
                    </div>

                    <div class="product-price">${this.formatPrice(product.price)} ₽</div>
                </div>
            </div>
        `).join('');
    }

    // Вспомогательные методы
    getProductImage(product) {
        if (product.imageUrl) return product.imageUrl;
        if (product.image) return product.image;
        return `https://picsum.photos/300/200?random=${product.id}&grayscale`;
    }

    formatPrice(price) {
        if (!price) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Состояния UI
    showLoading() {
        this.container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Загрузка товаров...</p>
            </div>
        `;
    }

    showEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <p>😔 Товаров пока нет</p>
                <small>Попробуйте позже</small>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-state">
                <p>⚠️ ${message}</p>
                <button onclick="productsManager.retry()" class="retry-btn">Повторить</button>
            </div>
        `;
    }

    // Обработчики событий
    setupEventListeners() {
        this.container.addEventListener('click', this.handleProductActions.bind(this));
    }

    handleProductActions(event) {
        const button = event.target.closest('.action-btn');
        if (!button) return;

        const productId = button.dataset.productId;

        if (button.classList.contains('wishlist-btn')) {
            this.toggleWishlist(productId);
        } else if (button.classList.contains('cart-btn')) {
            this.addToCart(productId);
        }
    }

    async toggleWishlist(productId) {
        console.log('♥ Toggle wishlist:', productId);
        // TODO: Реализовать API вызов
        this.showToast('Добавлено в избранное', 'success');
    }

    async addToCart(productId) {
        console.log('🛒 Add to cart:', productId);
        // TODO: Реализовать API вызов
        this.showToast('Товар добавлен в корзину', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async retry() {
        await this.init();
    }
}

// Глобальный экземпляр (можно использовать в консоли для дебага)
let productsManager;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    productsManager = new ProductsManager();
});