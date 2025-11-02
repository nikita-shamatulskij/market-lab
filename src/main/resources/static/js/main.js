// main.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 main.js loaded!");

    const categoriesDropdown = document.getElementById('categoriesDropdown');
    const categoriesSidebar = document.getElementById('categoriesSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    console.log("Dropdown element:", categoriesDropdown);
    console.log("Sidebar element:", categoriesSidebar);

    if (categoriesDropdown && categoriesSidebar) {
        console.log("✅ Categories elements found!");

        // Открытие панели
        categoriesDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🎯 Categories button clicked!");

            categoriesSidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Закрытие панели
        function closeCategoriesSidebar() {
            categoriesSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Закрытие по кнопке
        closeSidebar.addEventListener('click', closeCategoriesSidebar);

        // Закрытие по клику на overlay
        sidebarOverlay.addEventListener('click', closeCategoriesSidebar);

        // Закрытие по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && categoriesSidebar.classList.contains('open')) {
                closeCategoriesSidebar();
            }
        });

    } else {
        console.log("❌ Categories elements NOT found!");
    }

    // --- Открытие/закрытие меню профиля ---
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-menu');

    if(profileButton && profileMenu){
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            profileMenu.classList.remove('active');
        });
    }

    // --- Обработчик кликов по категориям (ОСНОВНОЙ) ---
    document.addEventListener('click', function(e) {
        const categoryLink = e.target.closest('.sidebar-category');
        if (!categoryLink) return;

        e.preventDefault();

        // Если это "Все товары"
        if (categoryLink.classList.contains('sidebar-all-categories')) {
            console.log('🔄 Loading all products');
            if (typeof loadAllProducts === 'function') {
                loadAllProducts();
            } else {
                window.location.href = '/';
            }
            closeCategoriesSidebar();
            return;
        }

        // Если это обычная категория
        const categoryId = categoryLink.getAttribute('data-category-id');
        const categoryName = categoryLink.textContent.trim();

        if (categoryId) {
            console.log(`📦 Loading category ID: ${categoryId}, Name: ${categoryName}`);

            // Используем функцию из search.js если доступна
            if (typeof loadProductsByCategory === 'function') {
                loadProductsByCategory(categoryId, categoryName);
            } else {
                // Fallback: переходим на главную с параметром категории
                window.location.href = `/?category=${categoryId}`;
            }

            closeCategoriesSidebar();
        }
    });

    // Функция закрытия сайдбара (для глобального доступа)
    window.closeCategoriesSidebar = function() {
        if (categoriesSidebar) {
            categoriesSidebar.classList.remove('open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    };
});