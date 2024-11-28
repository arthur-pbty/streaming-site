const checkTokenValidity = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    return fetch('/users/me', {
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('token');
            return false;
        }
        return true;
    })
    .catch(() => {
        localStorage.removeItem('token');
        return false;
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const profileLink = document.getElementById('profile-link');
    const adminLink = document.getElementById('admin-link');
    const logoutButton = document.getElementById('logout-button');

    if (token) {
        const isValid = await checkTokenValidity();
        if (!isValid) {
            window.location.href = 'login.html';
            return;
        }

        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'block';
        logoutButton.style.display = 'block';

        fetch('/users/me', {
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(user => {
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Bonjour ${user.email}`;
            }
            if (user.status === 'admin') {
                adminLink.style.display = 'block';
            }
        });

        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    } else {
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        profileLink.style.display = 'none';
        adminLink.style.display = 'none';
        logoutButton.style.display = 'none';
    }
});