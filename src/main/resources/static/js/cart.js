// cart.js - Cart Management System
class CartManager {
    constructor() {
        console.log('🛒 CartManager initialized');
        this.isInitialized = false;
        this.isLoading = false;
        this.init();
    }

    init() {
        if (this.isInitialized) {
            console.log('🔄 Reinitializing cart manager');
        }

        this.setupEventListeners();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Remove old handlers to prevent duplicates
        document.removeEventListener('click', this.handleDocumentClick);

        // Bind and add new handler
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.handleDocumentClick);
    }

    handleDocumentClick(e) {
        const cartBtn = e.target.closest('.cart-btn');
        if (cartBtn) {
            e.preventDefault();
            e.stopPropagation();

            // Находим productId из родительской карточки товара
            const productCard = cartBtn.closest('.product-card');
            const productId = productCard ? productCard.querySelector('.favorite-btn')?.dataset.productId : null;

            if (productId) {
                console.log('🛒 Add to cart button clicked, product:', productId);
                this.addToCart(productId, cartBtn);
            } else {
                console.error('❌ Product ID not found for cart button');
            }
        }
    }

    async addToCart(productId, buttonElement) {
        if (this.isLoading) {
            console.log('⏳ Operation in progress, please wait');
            return;
        }

        try {
            console.log('🔄 Adding to cart, product:', productId);

            const token = this.getToken();
            console.log('🔑 Token available:', !!token);

            if (!token) {
                console.log('❌ No token, showing auth modal');
                this.showAuthModal();
                return;
            }

            console.log('✅ User is authenticated, proceeding...');
            await this.sendAddToCartRequest(productId, buttonElement);

        } catch (error) {
            console.error('❌ Cart error:', error);
            this.showError('Ошибка: ' + error.message);
        }
    }

    getToken() {
        let token = localStorage.getItem('authToken');
        if (!token || token === 'null' || token === 'undefined' || token === '' || token.length < 10) {
            console.log('❌ Token invalid or missing');
            return null;
        }
        console.log('✅ Token is valid');
        return token;
    }

    async sendAddToCartRequest(productId, buttonElement) {
        const token = this.getToken();
        if (!token) {
            this.showAuthModal();
            return;
        }

        this.isLoading = true;
        this.showLoader(buttonElement);

        try {
            console.log('📤 Sending add to cart request via BFF...', 'Product ID:', productId);

            // ✅ Правильно - через BFF на порту 8083
            const response = await fetch(`/api/cart/add/${productId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Add to cart response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', response.status, errorText);

                if (response.status === 401) {
                    this.showAuthModal();
                    throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
                }

                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            const result = await response.text();
            console.log('✅ Add to cart success:', result);

            this.showSuccess('Товар добавлен в корзину');
            this.updateCartUI();

        } catch (error) {
            console.error('❌ Add to cart failed:', error);
            throw error;
        } finally {
            this.isLoading = false;
            this.hideLoader(buttonElement);
        }
    }

    async updateCartUI() {
        // Обновляем счетчик корзины в UI
        try {
            const cartData = await this.getCartData();
            console.log('🛒 Cart data for UI update:', cartData);

            if (cartData && Array.isArray(cartData)) {
                const totalItems = cartData.reduce((total, item) => total + (item.quantity || 1), 0);
                console.log('🛒 Total items in cart:', totalItems);
                this.updateCartCounter(totalItems);
            } else {
                console.log('🛒 No cart data or empty cart');
                this.updateCartCounter(0);
            }
        } catch (error) {
            console.error('❌ Error updating cart UI:', error);
            this.updateCartCounter(0);
        }
    }

    async getCartData() {
        const token = this.getToken();
        if (!token) {
            console.log('🛒 No token, skipping cart data fetch');
            return null;
        }

        try {
            console.log('🛒 Fetching cart data from BFF /api/cart');

            // ✅ Правильно - через BFF на порту 8083
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🛒 Cart response status:', response.status);

            if (response.ok) {
                const cartData = await response.json();
                console.log('🛒 Cart data received:', cartData);
                return cartData;
            } else {
                const errorText = await response.text();
                console.error('🛒 Cart fetch error:', response.status, errorText);
                return null;
            }
        } catch (error) {
            console.error('🛒 Error fetching cart data:', error);
            return null;
        }
    }

    updateCartCounter(count) {
        console.log('🛒 Updating cart counter to:', count);

        // Обновляем счетчик корзины в навигации
        const cartButtons = document.querySelectorAll('.nav-button');
        cartButtons.forEach(button => {
            const buttonText = button.querySelector('.button-text');
            if (buttonText && buttonText.textContent.includes('Корзина')) {
                // Удаляем старый счетчик если есть
                const existingCounter = button.querySelector('.cart-counter');
                if (existingCounter) {
                    existingCounter.remove();
                }

                // Добавляем новый счетчик
                if (count > 0) {
                    const counter = document.createElement('span');
                    counter.className = 'cart-counter';
                    counter.textContent = count;
                    counter.style.cssText = `
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #dc3545;
                        color: white;
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    `;

                    const iconSquare = button.querySelector('.icon-square');
                    if (iconSquare) {
                        iconSquare.style.position = 'relative';
                        iconSquare.appendChild(counter);
                    }
                }
            }
        });

        // Также обновляем счетчик в мобильной навигации если есть
        const mobileCartButtons = document.querySelectorAll('.mobile-nav-button');
        mobileCartButtons.forEach(button => {
            if (button.textContent.includes('Корзина')) {
                const existingCounter = button.querySelector('.cart-counter');
                if (existingCounter) {
                    existingCounter.remove();
                }

                if (count > 0) {
                    const counter = document.createElement('span');
                    counter.className = 'cart-counter';
                    counter.textContent = count;
                    counter.style.cssText = `
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #dc3545;
                        color: white;
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    `;
                    button.style.position = 'relative';
                    button.appendChild(counter);
                }
            }
        });
    }

    // UI methods
    showAuthModal() {
        console.log('🔐 Showing auth modal');
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
            loginModal.classList.add('show');
        } else {
            if (confirm('Для добавления в корзину необходимо войти в систему. Перейти к авторизации?')) {
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
        toast.className = `cart-toast cart-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        // Add styles
        if (!document.querySelector('#cart-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-toast-styles';
            styles.textContent = `
                .cart-toast {
                    position: fixed;
                    top: 80px;
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
                .cart-toast-error {
                    border-left-color: #dc3545;
                }
                .cart-toast .toast-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .cart-toast .toast-message {
                    flex: 1;
                    margin-right: 10px;
                }
                .cart-toast .toast-close {
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

    // Public methods for external access
    async refreshCart() {
        console.log('🔄 Refreshing cart data');
        await this.updateCartUI();
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('click', this.handleDocumentClick);
        console.log('🧹 CartManager destroyed');
    }
}

// Initialize cart manager
console.log('🚀 Starting cart manager...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cartManager = new CartManager();

        // Загружаем данные корзины после инициализации (с задержкой для стабилизации)
        setTimeout(() => {
            console.log('🛒 Initial cart UI update');
            window.cartManager.updateCartUI();
        }, 1500);
    });
} else {
    window.cartManager = new CartManager();

    // Загружаем данные корзины после инициализации (с задержкой для стабилизации)
    setTimeout(() => {
        console.log('🛒 Initial cart UI update');
        window.cartManager.updateCartUI();
    }, 1500);
}

// Global functions for external access
window.addToCart = function(productId) {
    console.log('🛒 Manual add to cart called for product:', productId);
    if (window.cartManager) {
        window.cartManager.addToCart(productId);
    }
};

window.refreshCart = function() {
    console.log('🔄 Manual cart refresh called');
    if (window.cartManager) {
        window.cartManager.refreshCart();
    }
};

window.getCartCount = async function() {
    if (window.cartManager) {
        const cartData = await window.cartManager.getCartData();
        if (cartData && Array.isArray(cartData)) {
            return cartData.reduce((total, item) => total + (item.quantity || 1), 0);
        }
    }
    return 0;
};

// Экспорт для использования в модульных системах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}

console.log('🛒 Cart manager ready!');