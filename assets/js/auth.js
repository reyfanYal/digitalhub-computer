/**
 * DigitalHub Computer - Authentication Engine (ES6+)
 * Revised with SweetAlert2 integration
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeUsersDatabase();

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function initializeUsersDatabase() {
    let users = JSON.parse(localStorage.getItem('users'));

    if (!users || !Array.isArray(users)) {
        users = [];
    }

    const adminExists = users.some(user => user.email === 'admin@digitalhub.com');

    if (!adminExists) {
        const defaultAdmin = {
            id: Date.now(),
            name: 'System Admin',
            email: 'admin@digitalhub.com',
            password: 'admin123',
            role: 'admin'
        };
        users.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Auth Engine: Default Admin seeded successfully.');
    }
}

/**
 * LOGIN LOGIC HANDLER
 */
function handleLogin(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    clearErrors(['emailError', 'passwordError']);

    let hasError = false;

    if (!emailInput.value.trim()) {
        showFieldError('emailError', 'Email address is required.');
        hasError = true;
    }
    if (!passwordInput.value) {
        showFieldError('passwordError', 'Password is required.');
        hasError = true;
    }

    if (hasError) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];

    const matchedUser = users.find(user =>
        user.email.toLowerCase() === emailInput.value.trim().toLowerCase() &&
        user.password === passwordInput.value
    );

    if (!matchedUser) {
        // SweetAlert2 Error Notification
        Swal.fire({
            icon: 'error',
            title: 'Login Gagal',
            text: 'Email atau password yang Anda masukkan salah!',
            confirmButtonColor: '#14213D'
        });
        return;
    }

    const sessionData = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(sessionData));

    // SweetAlert2 Success Notification & Redirect
    Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: `Selamat datang kembali, ${matchedUser.name}`,
        showConfirmButton: false,
        timer: 1500
    }).then(() => {
        if (matchedUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    });
}

/**
 * REGISTRATION LOGIC HANDLER
 */
function handleRegister(e) {
    e.preventDefault();

    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    clearErrors(['nameError', 'emailError', 'passwordError', 'confirmPasswordError']);

    let isValid = true;

    if (!nameInput.value.trim()) {
        showFieldError('nameError', 'Full name is required.');
        isValid = false;
    }

    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
        showFieldError('emailError', 'Email address is required.');
        isValid = false;
    } else if (!emailRegex.test(emailValue)) {
        showFieldError('emailError', 'Please enter a valid email format.');
        isValid = false;
    }

    const passwordValue = passwordInput.value;
    if (!passwordValue) {
        showFieldError('passwordError', 'Password is required.');
        isValid = false;
    } else if (passwordValue.length < 8) {
        showFieldError('passwordError', 'Password must be at least 8 characters long.');
        isValid = false;
    }

    if (!confirmPasswordInput.value) {
        showFieldError('confirmPasswordError', 'Please confirm your password.');
        isValid = false;
    } else if (passwordValue !== confirmPasswordInput.value) {
        showFieldError('confirmPasswordError', 'Passwords do not match.');
        isValid = false;
    }

    if (!isValid) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];

    const emailDuplicate = users.some(user => user.email.toLowerCase() === emailValue.toLowerCase());
    if (emailDuplicate) {
        // SweetAlert2 Duplicate Email Warning
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.',
            confirmButtonColor: '#FCA311'
        });
        return;
    }

    const newUser = {
        id: Date.now(),
        name: nameInput.value.trim(),
        email: emailValue,
        password: passwordValue,
        role: 'user'
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    registerForm.reset();

    // SweetAlert2 Success Registration & Redirect
    Swal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil!',
        text: 'Akun Anda berhasil dibuat. Silakan login untuk melanjutkan.',
        confirmButtonColor: '#14213D'
    }).then(() => {
        window.location.href = 'login.html';
    });
}

function showFieldError(elementId, message) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

function clearErrors(errorElementIds) {
    errorElementIds.forEach(id => {
        const errorSpan = document.getElementById(id);
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    });
}