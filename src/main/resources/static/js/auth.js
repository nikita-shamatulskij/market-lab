// auth.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const API_BASE_URL = 'http://localhost:8083/api/auth';
console.log('Auth.js loaded with URL:', API_BASE_URL);

// ---------------- MODAL FUNCTIONS ----------------
function openLoginModal() {
    closeAllModals();
    document.getElementById('loginModal').style.display = 'block';
}

function openRegisterModal() {
    closeAllModals();
    document.getElementById('registerModal').style.display = 'block';
}

function closeAllModals() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
}

// ---------------- MESSAGE HELPER ----------------
function showMessage(text, type) {
    const oldMessages = document.querySelectorAll('.message');
    oldMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    if (type === 'error') {
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
        }, 5000);
    }

    const currentModal = document.querySelector('.modal[style*="display: block"]');
    if (currentModal) {
        const form = currentModal.querySelector('form');
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ---------------- LOGIN FORM ----------------
function setupLoginForm() {
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = this.querySelector('input[type="text"]').value;
        const password = this.querySelector('input[type="password"]').value;

        if (!email || !password) {
            showMessage('Заполните все поля', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify({
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email
                }));
                showMessage(result.message, 'success');
                
                // Переинициализируем избранное после логина
                setTimeout(() => {
                    if (window.favoritesManager) {
                        console.log('🔄 Reinitializing favorites after login...');
                        window.favoritesManager.reinitializeAfterLogin();
                    }
                    // Если мы на странице избранного, перезагружаем список
                    if (window.location.pathname === '/favorites' && window.favoritesPageManager) {
                        console.log('🔄 Reloading favorites page after login...');
                        setTimeout(() => {
                            if (window.favoritesPageManager && window.favoritesPageManager.loadFavorites) {
                                window.favoritesPageManager.loadFavorites();
                            }
                        }, 300);
                    }
                }, 200);
                
                setTimeout(() => {
                    closeAllModals();
                    updateUIAfterLogin(result);
                }, 1500);
            } else {
                showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('🔌 Ошибка соединения с сервером', 'error');
        }
    });
}

// ---------------- REGISTER FORM ----------------
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    let isSubmitting = false;

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;

        const formData = new FormData(this);
        const data = {
            firstName: formData.get('firstName'),
            middleName: formData.get('middleName') || '',
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            phoneNumber: formData.get('phoneNumber') || ''
        };

        if (!data.firstName || !data.lastName || !data.email || !data.password) {
            showMessage('Заполните все обязательные поля', 'error');
            resetButton();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showMessage('Введите корректный email адрес', 'error');
            resetButton();
            return;
        }

        if (data.password.length < 6) {
            showMessage('Пароль должен содержать минимум 6 символов', 'error');
            resetButton();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.text();
            if (response.ok) {
                showMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
                setTimeout(() => {
                    closeAllModals();
                    openLoginModal();
                }, 2000);
            } else {
                let msg = 'Ошибка регистрации';
                if (result.toLowerCase().includes('email')) msg = 'Пользователь с таким email уже существует';
                showMessage(msg, 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            showMessage('Ошибка соединения с сервером', 'error');
        } finally {
            resetButton();
        }

        function resetButton() {
            isSubmitting = false;
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ---------------- CREATE PROFILE BUTTON ----------------
// В auth.js - ЗАМЕНИ функцию createProfileButton()
function createProfileButton(user) {
    const navButtons = document.querySelector('.nav-buttons');
    const loginButton = document.getElementById('loginButton');

    // Удаляем кнопку "Войти"
    if (loginButton) {
        loginButton.remove();
    }

    // Создаем кнопку профиля с новыми SVG иконками
    const profileButtonHTML = `
        <div class="nav-button profile-button" id="profileButton">
            <div class="icon-square">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="2" stroke="black" style="width: 24px; height: 24px;">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </div>
            <span class="button-text">Профиль</span>

            <div class="profile-menu hidden">
                <div class="profile-info">
                    <span id="profileName">${user.firstName} ${user.lastName}</span>
                </div>
                <ul>
                    <li>
                        <a href="#" id="favoritesLink">
                            <!-- ИЗБРАННОЕ -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 14" style="margin-right: 8px;">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7.004 12.383L1.53 7.424c-2.975-2.975 1.398-8.688 5.474-4.066c4.076-4.622 8.43 1.11 5.475 4.066z"/>
                            </svg>
                            Избранное
                        </a>
                    </li>
                    <li>
                        <a href="#" id="ordersLink">
                            <!-- ЗАКАЗЫ -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="margin-right: 8px;">
                                <path fill="currentColor" d="m17.371 19.827l2.84-2.796l-.626-.627l-2.214 2.183l-.956-.975l-.627.632l1.583 1.583ZM6.77 8.73h10.462v-1H6.769v1ZM18 22.115q-1.671 0-2.836-1.164T14 18.115q0-1.67 1.164-2.835T18 14.115q1.671 0 2.836 1.165T22 18.115q0 1.672-1.164 2.836Q19.67 22.115 18 22.115ZM4 20.77V5.615q0-.67.472-1.143Q4.944 4 5.615 4h12.77q.67 0 1.143.472q.472.472.472 1.143v5.945q-.244-.09-.485-.154q-.24-.064-.515-.1v-5.69q0-.231-.192-.424Q18.615 5 18.385 5H5.615q-.23 0-.423.192Q5 5.385 5 5.615V19.05h6.344q.068.41.176.802q.109.392.303.748l-.035.035l-1.134-.827l-1.346.961l-1.346-.961l-1.347.961l-1.346-.961L4 20.769Zm2.77-4.5h4.709q.056-.275.138-.515q.083-.24.193-.485H6.77v1Zm0-3.769h7.31q.49-.387 1.05-.645q.56-.259 1.197-.355H6.769v1ZM5 19.05V5v14.05Z"/>
                            </svg>
                            Мои заказы
                        </a>
                    </li>
                    <li>
                        <a href="#" id="logoutBtn">
                            <!-- ВЫЙТИ -->
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px; margin-right: 8px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                            Выйти
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    `;

    // Вставляем кнопку профиля на место кнопки "Войти"
    navButtons.insertAdjacentHTML('afterbegin', profileButtonHTML);

    // Настраиваем меню профиля
    setupProfileMenu();
}

// ---------------- PROFILE MENU FUNCTIONS ----------------
function setupProfileMenu() {
    const profileButton = document.getElementById('profileButton');
    const profileMenu = profileButton?.querySelector('.profile-menu');

    if (!profileButton || !profileMenu) {
        console.log('Profile button or menu not found');
        return;
    }

    console.log('Setting up profile menu...');

    // Показываем меню при наведении
    profileButton.addEventListener('mouseenter', () => {
        console.log('Mouse enter profile button');
        profileMenu.classList.remove('hidden');
    });

    // Скрываем меню при уходе мыши
    profileButton.addEventListener('mouseleave', (e) => {
        setTimeout(() => {
            if (!profileButton.matches(':hover') && !profileMenu.matches(':hover')) {
                profileMenu.classList.add('hidden');
            }
        }, 200);
    });

    // Также обрабатываем уход мыши с самого меню
    profileMenu.addEventListener('mouseleave', () => {
        profileMenu.classList.add('hidden');
    });

    // Обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            location.reload(); // Перезагружаем страницу чтобы вернуть кнопку "Войти"
        });
    }

    // Обработчик для ссылки "Избранное"
    const favoritesLink = document.getElementById('favoritesLink');
    if (favoritesLink) {
        favoritesLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/favorites';
        });
    }
}

// ---------------- UPDATE UI AFTER LOGIN ----------------
function updateUIAfterLogin(user) {
    console.log('Updating UI after login for user:', user);
    createProfileButton(user);
}

// ---------------- CHECK AUTH STATUS ON LOAD ----------------
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    console.log('Checking auth status - Token:', token, 'UserData:', userData);

    if (token && userData) {
        try {
            const parsed = JSON.parse(userData);
            console.log('User is authenticated:', parsed);
            createProfileButton(parsed);
        } catch (e) {
            console.warn('Ошибка при восстановлении userData:', e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    } else {
        console.log('User is not authenticated');
    }
}

// ---------------- INITIALIZE MODALS ----------------
function initAuthModals() {
    console.log("Auth modals initialized");

    // Только кнопка "Войти" открывает модальное окно
    document.getElementById('loginButton')?.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
    });

    // Закрытие модальных окон
    document.querySelector('.close')?.addEventListener('click', closeAllModals);
    document.querySelector('.close-register')?.addEventListener('click', closeAllModals);

    // Ссылки для переключения между модалками
    document.querySelector('.modal-links a[href="#"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        openRegisterModal();
    });

    document.querySelector('.switch-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
    });

    // Закрытие по клику вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeAllModals();
    });

    setupLoginForm();
    setupRegisterForm();
}


// В auth.js, после успешного логина
// В auth.js, после успешного логина
function handleLoginSuccess(userData, token) {
    console.log('🔑 Login successful, updating UI...');

    // Сохраняем токен
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    // Обновляем UI
    updateUIAfterLogin(userData);

    // ГАРАНТИРОВАННО ПЕРЕИНИЦИАЛИЗИРУЕМ ИЗБРАННОЕ
    setTimeout(() => {
        console.log('🔄 Reinitializing favorites after login...');
        if (window.favoritesManager) {
            console.log('✅ Favorites manager found, reinitializing...');
            window.favoritesManager.reinitializeAfterLogin();
        } else {
            console.log('❌ Favorites manager not found, creating new one...');
            // Создаем новый экземпляр если не существует
            window.favoritesManager = new FavoritesManager();
        }

        // Принудительно обновляем все кнопки
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        console.log('🎯 Found', favoriteButtons.length, 'favorite buttons');
    }, 100);

    closeLoginModal();
}





// ---------------- AUTO INIT ----------------
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth...');
    initAuthModals();
    checkAuthStatus(); // Проверяем статус авторизации при загрузке
});