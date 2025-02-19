document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    // Reset users database to only have admin user
    const initializeUsers = () => {
        const adminUser = {
            admin: {
                email: 'admin@example.com',
                password: 'admin'
            }
        };
        localStorage.setItem('users', JSON.stringify(adminUser));
    };

    // Initialize admin user
    initializeUsers();

    const getUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : {};
    };

    const saveUser = (username, email, password) => {
        const users = getUsers();
        // Store username in lowercase for case-insensitive comparison
        users[username.toLowerCase()] = { email, password: password.toLowerCase() };
        localStorage.setItem('users', JSON.stringify(users));
    };

    const validateUser = (username, password) => {
        const users = getUsers();
        // Compare in lowercase for case-insensitive validation
        const user = users[username.toLowerCase()];
        return user?.password === password.toLowerCase();
    };

    const showError = (formId, message) => {
        const errorDiv = document.getElementById(`${formId}-error`);
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('shake');
        
        setTimeout(() => {
            errorDiv.classList.remove('shake');
        }, 500);

        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.style.opacity = '1';
            }, 300);
        }, 5000);
    };

    const switchForm = (showForm, hideForm) => {
        hideForm.style.display = 'none';
        showForm.style.display = 'block';
        
        hideForm.querySelector('form').classList.add('slide-out');
        showForm.querySelector('form').classList.remove('slide-out');
    };

    showRegisterLink?.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(registerFormContainer, loginFormContainer);
    });

    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginFormContainer, registerFormContainer);
    });

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (validateUser(username, password)) {
            if (window.auth && window.auth.login(username, password)) {
                window.location.href = 'index.html';
            }
        } else {
            showError('login', 'Invalid username or password. Please check your CAPS LOCK key.');
        }
    });

    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            showError('register', 'Passwords do not match! Please check your input and CAPS LOCK key.');
            return;
        }

        if (password.length < 6) {
            showError('register', 'Password must be at least 6 characters long.');
            return;
        }

        const users = getUsers();
        if (users[username.toLowerCase()]) {
            showError('register', 'Username already exists. Please choose another one.');
            return;
        }

        saveUser(username, email, password);
        if (window.auth && window.auth.login(username, password)) {
            window.location.href = 'index.html';
        }
    });

    // Fix: Use keydown event and check capsLock properly
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.getModifierState && event.getModifierState('CapsLock')) {
                showError(input.closest('form').id, 'Warning: CAPS LOCK is on!');
            }
        });
    });
});