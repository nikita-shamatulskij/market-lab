document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    let searchTimeout;
    let currentCategoryTitle = null;

    // Обработчик ввода в поиск
    searchInput.addEventListener('input', function(e) {
        const term = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (term.length === 0) {
            loadAllProducts();
            return;
        }

        searchTimeout = setTimeout(() => {
            searchProducts(term);
        }, 300);
    });

    // Обработчик кликов для кнопок избранного в динамически созданных карточках
    productsGrid.addEventListener('click', function(e) {
        const favoriteBtn = e.target.closest('.wishlist-btn');
        if (favoriteBtn) {
            e.preventDefault();
            e.stopPropagation();

            const productId = favoriteBtn.dataset.productId;
            console.log('❤️ Favorite button clicked in search results, product:', productId);

            // Используем существующий favoritesManager
            if (window.favoritesManager) {
                window.favoritesManager.toggleFavorite(productId, favoriteBtn);
            } else {
                console.error('Favorites manager not available');
            }
        }
    });

    // Поиск товаров
    async function searchProducts(query) {
        try {
            removeCategoryTitle();
            const response = await fetch(`/api/product/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Ошибка поиска');
            const products = await response.json();
            displayProducts(products);
        } catch (err) {
            console.error(err);
            showErrorMessage('Ошибка поиска');
        }
    }

    // Загрузка всех товаров
    async function loadAllProducts() {
        try {
            removeCategoryTitle();
            const response = await fetch('/api/product');
            if (!response.ok) throw new Error('Ошибка загрузки всех товаров');
            const products = await response.json();
            displayProducts(products);
        } catch (err) {
            console.error(err);
            showErrorMessage('Ошибка загрузки товаров');
        }
    }

    // Загрузка товаров по категории
    async function loadProductsByCategory(categoryId, categoryName = '') {
        try {
            removeCategoryTitle();
            const response = await fetch(`/api/product/category/${categoryId}`);
            if (!response.ok) throw new Error('Ошибка загрузки категории');
            const products = await response.json();

            if (!products || products.length === 0) {
                showEmptyCategoryMessage(categoryName);
                return;
            }

            showCategoryTitle(categoryName);
            displayProducts(products);
        } catch (err) {
            console.error(err);
            showErrorMessage('Ошибка загрузки категории');
        }
    }

    // Отображение товаров
    function displayProducts(products) {
        productsGrid.innerHTML = '';

        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
            <div class="no-results-message">
                <p>😔 Ничего не найдено</p>
                <small>Попробуйте изменить запрос</small>
            </div>
        `;
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const imageUrl = product.imageUrl || '';
            card.innerHTML = `
            <div class="product-card-inner">
                <a href="/product/${product.id}" class="product-link">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <div class="product-price">${product.price} ₽</div>
                    </div>
                </a>
                <div class="product-actions">
                    <button class="action-btn wishlist-btn favorite-btn" 
                            type="button"
                            data-product-id="${product.id}"
                            title="Добавить в избранное">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             stroke-width="1.5" stroke="currentColor" class="favorite-icon">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
                        </svg>
                    </button>
                    <button class="action-btn cart-btn" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
            productsGrid.appendChild(card);
        });

        // Обновляем состояние кнопок избранного после отрисовки
        if (window.favoritesManager) {
            window.favoritesManager.loadFavorites();
        }
    }

    // Показать заголовок категории
    function showCategoryTitle(categoryName) {
        removeCategoryTitle();
        currentCategoryTitle = document.createElement('h2');
        currentCategoryTitle.className = 'category-title';
        currentCategoryTitle.textContent = `Категория: ${categoryName}`;
        currentCategoryTitle.style.textAlign = 'center';
        currentCategoryTitle.style.marginBottom = '2rem';
        currentCategoryTitle.style.fontFamily = 'Montserrat, sans-serif';
        currentCategoryTitle.style.color = '#333';
        productsGrid.parentNode.insertBefore(currentCategoryTitle, productsGrid);
    }

    // Удалить заголовок категории
    function removeCategoryTitle() {
        if (currentCategoryTitle) {
            currentCategoryTitle.remove();
            currentCategoryTitle = null;
        }
    }

    // Сообщение для пустой категории
    function showEmptyCategoryMessage(categoryName) {
        productsGrid.innerHTML = `
            <div class="empty-category-message">
                <p>В категории "${categoryName}" пока нет товаров</p>
                <small>Попробуйте другие категории или зайдите позже</small>
                <br>
                <button onclick="loadAllProducts()" class="back-button">← Смотреть все товары</button>
            </div>
        `;
    }

    // Показать сообщение об ошибке
    function showErrorMessage(msg) {
        productsGrid.innerHTML = `
            <div class="no-results-message">
                <p>⚠️ ${msg}</p>
                <small>Попробуйте позже</small>
            </div>
        `;
    }

    // Обработчик кликов по категориям
    document.addEventListener('click', function(e) {
        const categoryLink = e.target.closest('.sidebar-category');
        if (!categoryLink) return;

        e.preventDefault();

        if (categoryLink.classList.contains('sidebar-all-categories')) {
            loadAllProducts();
            closeCategoriesSidebar();
            return;
        }

        const categoryId = categoryLink.getAttribute('data-category-id');
        const categoryName = categoryLink.textContent.trim();

        if (categoryId) {
            console.log('Загружаем категорию:', categoryId, categoryName);
            loadProductsByCategory(categoryId, categoryName);
            closeCategoriesSidebar();
        }
    });

    // Сделать функцию глобальной для вызова из HTML
    window.loadProductsByCategory = loadProductsByCategory;
    window.loadAllProducts = loadAllProducts;

    // Загружаем все товары при первой загрузке страницы
    loadAllProducts();
});