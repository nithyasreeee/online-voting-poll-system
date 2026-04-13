/**
 * Auth.js - Authentication and Authorization
 * Handles login, signup, logout, and role-based access control
 */

(function() {
    'use strict';

    // ===== AUTHENTICATION LOGIC =====
    const ADMIN_SIGNUP_CODE = 'ADMIN2026';

    const Auth = {
        login: function(username, password, role) {
            const result = storage.loginUser(username, password);

            if (!result.success) {
                showAlert('danger', result.message || 'Login failed.');
                return;
            }

            if (result.user.role !== role) {
                storage.logoutUser();
                showAlert('danger', `Role mismatch. This account is ${result.user.role}.`);
                return;
            }

            showAlert('success', result.message);
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        },

        signup: function(username, password, confirmPassword, role, adminCode) {
            // Validation
            if (password !== confirmPassword) {
                showAlert('danger', 'Passwords do not match');
                return;
            }

            if (password.length < 4) {
                showAlert('danger', 'Password must be at least 4 characters long');
                return;
            }

            if (role === 'admin' && adminCode !== ADMIN_SIGNUP_CODE) {
                showAlert('danger', 'Invalid admin access code');
                return;
            }

            const result = storage.registerUser(username, password, role || 'user');
            
            if (result.success) {
                showAlert('success', 'Account created successfully! Please login.');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert('danger', result.message);
            }
        },

        logout: function() {
            storage.logoutUser();
            window.location.href = 'index.html';
        },

        isLoggedIn: function() {
            return storage.isUserLoggedIn();
        },

        getCurrentUser: function() {
            return storage.getCurrentUser();
        },

        requireAuth: function() {
            if (!this.isLoggedIn()) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        }
    };

    // ===== PAGE INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        handleAuthPage();
        handleLogoutButtons();
        handleUserDisplay();
    });

    // ===== AUTH PAGE HANDLER =====
    function handleAuthPage() {
        const loginForm = document.getElementById('formLogin');
        const signupForm = document.getElementById('formSignup');
        const authToggleBtns = document.querySelectorAll('.auth-btn');
        const signupRoleInputs = document.querySelectorAll('input[name="signupRole"]');
        const adminCodeGroup = document.getElementById('adminCodeGroup');

        if (signupRoleInputs.length > 0 && adminCodeGroup) {
            signupRoleInputs.forEach(input => {
                input.addEventListener('change', function() {
                    const selectedRole = document.querySelector('input[name="signupRole"]:checked')?.value;
                    if (selectedRole === 'admin') {
                        adminCodeGroup.classList.remove('hidden');
                    } else {
                        adminCodeGroup.classList.add('hidden');
                        const adminCodeInput = document.getElementById('adminAccessCode');
                        if (adminCodeInput) {
                            adminCodeInput.value = '';
                        }
                    }
                });
            });
        }

        // Auth toggle functionality
        if (authToggleBtns.length > 0) {
            authToggleBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const authType = this.dataset.auth;
                    authToggleBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    document.getElementById('loginForm')?.classList.remove('active');
                    document.getElementById('signupForm')?.classList.remove('active');

                    if (authType === 'login') {
                        document.getElementById('loginForm')?.classList.add('active');
                    } else if (authType === 'signup') {
                        document.getElementById('signupForm')?.classList.add('active');
                    }
                });
            });
        }

        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('loginUsername').value.trim();
                const password = document.getElementById('loginPassword').value;
                const role = document.querySelector('input[name="role"]:checked').value;

                if (!username || !password) {
                    showAlert('danger', 'Please fill in all fields');
                    return;
                }

                Auth.login(username, password, role);
            });
        }

        // Signup form submission
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('signupUsername').value.trim();
                const password = document.getElementById('signupPassword').value;
                const confirmPassword = document.getElementById('signupConfirm').value;
                const role = document.querySelector('input[name="signupRole"]:checked')?.value || 'user';
                const adminCode = document.getElementById('adminAccessCode')?.value?.trim() || '';

                if (!username || !password || !confirmPassword) {
                    showAlert('danger', 'Please fill in all fields');
                    return;
                }

                Auth.signup(username, password, confirmPassword, role, adminCode);
            });
        }
    }

    // ===== LOGOUT HANDLER =====
    function handleLogoutButtons() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to logout?')) {
                    Auth.logout();
                }
            });
        }
    }

    // ===== USER INFO DISPLAY =====
    function handleUserDisplay() {
        const userRole = document.getElementById('userRole');
        const userName = document.getElementById('userName');
        
        const currentUser = Auth.getCurrentUser();
        if (currentUser) {
            if (userRole) userRole.textContent = `[${currentUser.role.toUpperCase()}]`;
            if (userName) userName.textContent = currentUser.username;
        }
    }

    // ===== UTILITY FUNCTION =====
    function showAlert(type, message) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';
        alert.style.maxWidth = '500px';
        alert.innerHTML = `<strong>${type === 'success' ? '✓' : '✕'} ${message}</strong>`;
        
        document.body.appendChild(alert);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            alert.remove();
        }, 4000);
    }

    // ===== GLOBAL EXPORTS =====
    window.Auth = Auth;
    window.showAlert = showAlert;

})();
