// ── Modal Helpers ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function switchModal(close, open) { closeModal(close); openModal(open); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Auth ──
async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = 'block'; return;
  }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('et_user', JSON.stringify(data.user));
      closeModal('loginModal');
      updateNavAuth(data.user);
      window.location.href = '/dashboard';
    } else {
      errEl.textContent = data.message || 'Login failed.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent = 'Network error. Please try again.';
    errEl.style.display = 'block';
  }
}

async function handleRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const location = document.getElementById('regLocation').value || 'Chennai';
  const errEl = document.getElementById('registerError');
  errEl.style.display = 'none';

  if (!name || !email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = 'block'; return;
  }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, location })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('et_user', JSON.stringify(data.user));
      closeModal('registerModal');
      updateNavAuth(data.user);
      window.location.href = '/dashboard';
    } else {
      errEl.textContent = data.message || 'Registration failed.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent = 'Network error. Please try again.';
    errEl.style.display = 'block';
  }
}

function updateNavAuth(user) {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  if (user) {
    navAuth.innerHTML = `
      <span style="color:var(--green-mid);font-weight:600;font-size:0.9rem">👋 ${user.name}</span>
      <button class="btn-outline" onclick="handleLogout()">Logout</button>
    `;
  } else {
    navAuth.innerHTML = `
      <button class="btn-outline" onclick="openModal('loginModal')">Login</button>
      <button class="btn-primary" onclick="openModal('registerModal')">Sign Up</button>
    `;
  }
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('et_user');
  updateNavAuth(null);
  window.location.href = '/';
}

// Init nav on load
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  updateNavAuth(user);
});
