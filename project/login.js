document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (auth.login(username, password)) {
        window.location.href = 'index.html';
    }
});

document.getElementById('register-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    // For this example, we'll just use the same login form
    // In a real application, you'd want to show a registration form
    alert('For this demo, you can login with any username and password');
});