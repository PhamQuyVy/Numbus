document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('loginForm');
    var loginButton = document.getElementById('Login');
    var loginAlert = document.getElementById('loginAlert');

    function setLoginLoading(active) {
        if (!loginButton) return;
        loginButton.disabled = active;
        loginButton.classList.toggle('loading', active);
        loginButton.querySelector('.button-label').textContent = active ? 'Đang đăng nhập...' : 'Đăng nhập';
    }

    document.querySelectorAll('[data-toggle-password]').forEach(function (togglePassword) {
        togglePassword.addEventListener('click', function () {
            var password = document.getElementById(togglePassword.dataset.togglePassword);
            var shouldShow = password.type === 'password';
            password.type = shouldShow ? 'text' : 'password';
            togglePassword.setAttribute('aria-label', shouldShow ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            var emailInput = document.getElementById('email');
            var passwordInput = document.getElementById('password');
            var email = emailInput.value.trim();
            var password = passwordInput.value;
            var valid = true;

            document.querySelectorAll('.field-error').forEach(function (item) { item.textContent = ''; });
            emailInput.classList.remove('invalid');
            passwordInput.classList.remove('invalid');
            loginAlert.hidden = true;

            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                emailInput.classList.add('invalid');
                document.getElementById('emailError').textContent = email
                    ? 'Email chưa đúng định dạng.'
                    : 'Vui lòng nhập email.';
                valid = false;
            }
            if (!password) {
                passwordInput.classList.add('invalid');
                document.getElementById('passwordError').textContent = 'Vui lòng nhập mật khẩu.';
                valid = false;
            }
            if (!valid) return;

            setLoginLoading(true);
            try {
                var response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });
                if (!response.ok) throw new Error(String(response.status));
                var data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/user/profile';
            } catch (error) {
                loginAlert.textContent = error.message === '401' || error.message === '403'
                    ? 'Email hoặc mật khẩu không chính xác.'
                    : 'Không thể kết nối máy chủ. Vui lòng thử lại.';
                loginAlert.hidden = false;
                setLoginLoading(false);
            }
        });

        ['email', 'password'].forEach(function (id) {
            document.getElementById(id).addEventListener('input', function () {
                this.classList.remove('invalid');
                document.getElementById(id + 'Error').textContent = '';
                loginAlert.hidden = true;
            });
        });
    }

    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        var registerButton = document.getElementById('Register');
        var registerAlert = document.getElementById('registerAlert');

        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            var fullName = document.getElementById('fullName').value.trim();
            var email = document.getElementById('registerEmail').value.trim();
            var password = document.getElementById('registerPassword').value;
            var confirmPassword = document.getElementById('confirmPassword').value;
            var valid = true;

            document.querySelectorAll('.field-error').forEach(function (item) { item.textContent = ''; });
            document.querySelectorAll('#registerForm input').forEach(function (input) { input.classList.remove('invalid'); });
            registerAlert.hidden = true;

            if (fullName.length < 2) {
                document.getElementById('fullName').classList.add('invalid');
                document.getElementById('fullNameError').textContent = 'Vui lòng nhập họ tên.';
                valid = false;
            }
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                document.getElementById('registerEmail').classList.add('invalid');
                document.getElementById('registerEmailError').textContent = 'Email chưa đúng định dạng.';
                valid = false;
            }
            if (password.length < 6) {
                document.getElementById('registerPassword').classList.add('invalid');
                document.getElementById('registerPasswordError').textContent = 'Mật khẩu cần ít nhất 6 ký tự.';
                valid = false;
            }
            if (confirmPassword !== password) {
                document.getElementById('confirmPassword').classList.add('invalid');
                document.getElementById('confirmPasswordError').textContent = 'Mật khẩu xác nhận không khớp.';
                valid = false;
            }
            if (!valid) return;

            registerButton.disabled = true;
            registerButton.classList.add('loading');
            registerButton.querySelector('.button-label').textContent = 'Đang tạo tài khoản...';

            try {
                var signupResponse = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName: fullName, email: email, password: password, images: '/images/default.png' })
                });
                if (!signupResponse.ok) throw new Error(String(signupResponse.status));

                var loginResponse = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });
                if (!loginResponse.ok) throw new Error('LOGIN_FAILED');
                var loginData = await loginResponse.json();
                localStorage.setItem('token', loginData.token);
                window.location.href = '/user/profile';
            } catch (error) {
                registerAlert.textContent = error.message === '409' || error.message === '500'
                    ? 'Email này đã được sử dụng.'
                    : 'Không thể tạo tài khoản. Vui lòng thử lại.';
                registerAlert.hidden = false;
                registerButton.disabled = false;
                registerButton.classList.remove('loading');
                registerButton.querySelector('.button-label').textContent = 'Tạo tài khoản';
            }
        });

        document.querySelectorAll('#registerForm input').forEach(function (input) {
            input.addEventListener('input', function () {
                this.classList.remove('invalid');
                var error = document.getElementById(this.id + 'Error');
                if (error) error.textContent = '';
                registerAlert.hidden = true;
            });
        });
    }

    var profileContent = document.getElementById('profileContent');

    async function loadProfile() {
        var token = localStorage.getItem('token');
        if (!token) {
            window.location.replace('/login');
            return;
        }

        var controller = new AbortController();
        var timeout = window.setTimeout(function () { controller.abort(); }, 8000);

        try {
            var response = await fetch('/users/me', {
                headers: { 'Authorization': 'Bearer ' + token },
                signal: controller.signal
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.replace('/login');
                return;
            }
            if (!response.ok) throw new Error('HTTP ' + response.status);

            var data = await response.json();
            var name = data.fullName || 'Người dùng';
            var image = data.images && data.images.trim() ? data.images : '/images/default.png';
            var created = data.createdAt ? new Intl.DateTimeFormat('vi-VN').format(new Date(data.createdAt)) : '—';

            document.getElementById('profile').textContent = name;
            document.getElementById('detailName').textContent = name;
            document.getElementById('welcomeName').textContent = name.split(' ').pop();
            document.getElementById('profileEmail').textContent = data.email || '—';
            document.getElementById('detailEmail').textContent = data.email || '—';
            document.getElementById('detailId').textContent = data.id ? '#' + data.id : '—';
            document.getElementById('detailCreated').textContent = created;

            var avatar = document.getElementById('images');
            avatar.src = image;
            avatar.onerror = function () {
                avatar.onerror = null;
                avatar.src = '/images/default.png';
            };

        } catch (error) {
            console.error('Không tải được thông tin hồ sơ:', error);
        } finally {
            window.clearTimeout(timeout);
        }
    }

    if (profileContent) loadProfile();

    var logout = document.getElementById('logout');
    if (logout) {
        logout.addEventListener('click', function () {
            localStorage.removeItem('token');
            window.location.href = '/login';
        });
    }
});
