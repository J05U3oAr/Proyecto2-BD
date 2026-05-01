// ── Auth guard ────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res  = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.ok) { window.location.href = '/login.html'; return null; }
    return data.usuario;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

// ── Render sidebar ────────────────────────────────────────────
function renderSidebar(usuario, activePage) {
  const nav = [
    { href: 'dashboard.html',  icon: '◈', label: 'Dashboard' },
    { href: 'productos.html',  icon: '◉', label: 'Productos' },
    { href: 'clientes.html',   icon: '◎', label: 'Clientes' },
    { href: 'ventas.html',     icon: '◆', label: 'Ventas' },
    { href: 'reportes.html',   icon: '◐', label: 'Reportes' },
  ];

  const initials = usuario.nombre.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-logo">
      <h1>ALIENTRONIC</h1>
      <p>SISTEMA DE GESTIÓN</p>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">Navegación</div>
      ${nav.map(item => `
        <a class="nav-item ${activePage === item.href ? 'active' : ''}" href="/pages/${item.href}">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-user">
      <div class="user-avatar">${initials}</div>
      <div class="user-info">
        <p>${usuario.nombre}</p>
        <p>${usuario.puesto}</p>
      </div>
    </div>
  `;
}

// ── Toast notifications ────────────────────────────────────────
function initToasts() {
  if (!document.getElementById('toast-container')) {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
}

function toast(msg, type = 'info') {
  initToasts();
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Logout ────────────────────────────────────────────────────
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login.html';
}

// ── Format helpers ────────────────────────────────────────────
function fmtMoney(n) {
  return 'Q ' + parseFloat(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stockBadge(s) {
  if (s === 0) return `<span class="badge badge-red">Sin stock</span>`;
  if (s < 5)   return `<span class="badge badge-yellow">${s} uds</span>`;
  return `<span class="badge badge-green">${s} uds</span>`;
}
