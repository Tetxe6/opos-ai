/* ════════════════════════════════════════
   OposAI — auth.js
   Gestión de sesión y usuarios
   (Versión local con localStorage — en el futuro se reemplazará con backend real)
   ════════════════════════════════════════ */


/* ── UTILIDADES DE SESIÓN ── */

function getUsuarios() {
    return JSON.parse(localStorage.getItem('oposai_users') || '[]');
}

function guardarUsuarios(users) {
    localStorage.setItem('oposai_users', JSON.stringify(users));
}

function getSesion() {
    return JSON.parse(localStorage.getItem('oposai_sesion') || 'null');
}

function guardarSesion(user) {
    localStorage.setItem('oposai_sesion', JSON.stringify(user));
}

function cerrarSesion() {
    localStorage.removeItem('oposai_sesion');
    window.location.href = 'index.html';
}


/* ── PROTEGER LA APP ── */
// Si estamos en app.html y no hay sesión, redirigir al login
if (window.location.pathname.endsWith('app.html')) {
    const sesion = getSesion();
    if (!sesion) {
        window.location.href = 'login.html';
    } else {
        // Mostrar nombre e inicial del usuario en el sidebar
        document.addEventListener('DOMContentLoaded', () => {
            const el = document.getElementById('userName');
            const av = document.getElementById('userAvatar');
            if (el) el.textContent = sesion.nombre;
            if (av) av.textContent = sesion.nombre.charAt(0).toUpperCase();
        });
    }
}

// Si estamos en login.html y ya hay sesión, ir directo a la app
if (window.location.pathname.endsWith('login.html')) {
    if (getSesion()) {
        window.location.href = 'app.html';
    }
}


/* ── TABS LOGIN / REGISTRO ── */

function switchTab(tab) {
    const tabLogin    = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');
    const formLogin   = document.getElementById('form-login');
    const formReg     = document.getElementById('form-registro');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegistro.classList.remove('active');
        formLogin.style.display = 'block';
        formReg.style.display   = 'none';
    } else {
        tabRegistro.classList.add('active');
        tabLogin.classList.remove('active');
        formReg.style.display   = 'block';
        formLogin.style.display = 'none';
    }
}


/* ── LOGIN ── */

function doLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass  = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');

    errEl.style.display = 'none';

    if (!email || !pass) {
        mostrarError(errEl, 'Rellena todos los campos.');
        return;
    }

    const users = getUsuarios();
    const user  = users.find(u => u.email === email && u.pass === pass);

    if (!user) {
        mostrarError(errEl, 'Email o contraseña incorrectos.');
        return;
    }

    guardarSesion(user);
    window.location.href = 'app.html';
}


/* ── REGISTRO ── */

function doRegistro() {
    const nombre = document.getElementById('reg-nombre').value.trim();
    const email  = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass   = document.getElementById('reg-pass').value;
    const errEl  = document.getElementById('reg-error');

    errEl.style.display = 'none';

    if (!nombre || !email || !pass) {
        mostrarError(errEl, 'Rellena todos los campos.');
        return;
    }

    if (pass.length < 6) {
        mostrarError(errEl, 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const users = getUsuarios();

    if (users.find(u => u.email === email)) {
        mostrarError(errEl, 'Ya existe una cuenta con ese email.');
        return;
    }

    const nuevoUser = {
        id:     Date.now().toString(),
        nombre,
        email,
        pass,
        creadoEn: new Date().toISOString()
    };

    users.push(nuevoUser);
    guardarUsuarios(users);
    guardarSesion(nuevoUser);

    window.location.href = 'app.html';
}


/* ── HELPER ── */

function mostrarError(el, msg) {
    el.textContent     = msg;
    el.style.display   = 'block';
}