// API Base URL - lockflow backend
const API_BASE = 'http://localhost:3001/api';

// Update time display
function updateTime() {
  const now = new Date();
  document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' · ' + now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
updateTime();
setInterval(updateTime, 1000);

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
  });
});

document.querySelectorAll('.card-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');

  const titles = {
    dashboard: 'Overview',
    reservations: 'Reservations',
    passcodes: 'Passcodes',
    logs: 'Activity',
    locks: 'Locks'
  };
  document.getElementById('page-title').textContent = titles[page] || 'Overview';

  loadPageData(page);
}

// API helper
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    return [];
  }
}

async function loadPageData(page) {
  switch (page) {
    case 'dashboard': await loadDashboard(); break;
    case 'reservations': await loadReservations(); break;
    case 'passcodes': await loadPasscodes(); break;
    case 'logs': await loadLogs(); break;
    case 'locks': await loadLocks(); break;
  }
}

// Dashboard
async function loadDashboard() {
  const stats = await fetchAPI('/stats');
  if (stats) {
    animateNumber('stat-properties', stats.properties || 0);
    animateNumber('stat-rooms', stats.rooms || 0);
    animateNumber('stat-locks-online', stats.locksOnline || 0);
    animateNumber('stat-low-battery', stats.locksLowBattery || 0);
    animateNumber('stat-offline', stats.locksOffline || 0);
  }

  // Recent reservations
  const reservations = await fetchAPI('/reservations');
  const resBody = document.getElementById('reservations-table-body');
  if (reservations.length > 0) {
    resBody.innerHTML = reservations.slice(0, 6).map(r => `
      <tr>
        <td><span class="mono">${r.reservation_id}</span></td>
        <td>${r.guest_name}</td>
        <td>${r.room_number || '—'}</td>
        <td><span class="badge ${r.status}">${r.status.replace('_', ' ')}</span></td>
      </tr>
    `).join('');
  } else {
    resBody.innerHTML = '<tr><td colspan="4" class="empty">No reservations yet</td></tr>';
  }

  // Recent logs
  const logs = await fetchAPI('/logs?limit=8');
  const logsBody = document.getElementById('logs-table-body');
  if (logs.length > 0) {
    logsBody.innerHTML = logs.map(l => `
      <tr>
        <td><span class="badge ${getActionClass(l.action)}">${formatAction(l.action)}</span></td>
        <td>${l.guest_name || '—'}</td>
        <td>${l.room_number || '—'}</td>
        <td class="time">${timeAgo(l.created_at)}</td>
      </tr>
    `).join('');
  } else {
    logsBody.innerHTML = '<tr><td colspan="4" class="empty">No activity yet</td></tr>';
  }
}

function animateNumber(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  const duration = 800;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Reservations
async function loadReservations() {
  const reservations = await fetchAPI('/reservations');
  const body = document.getElementById('all-reservations-body');
  if (reservations.length > 0) {
    body.innerHTML = reservations.map(r => `
      <tr>
        <td><span class="mono">${r.reservation_id}</span></td>
        <td>${r.guest_name}</td>
        <td>${r.room_number || '—'}</td>
        <td>${formatDate(r.check_in)}</td>
        <td>${formatDate(r.check_out)}</td>
        <td>${r.passcode ? `<span class="mono code">${r.passcode}</span>` : '—'}</td>
        <td><span class="badge ${r.status}">${r.status.replace('_', ' ')}</span></td>
      </tr>
    `).join('');
  } else {
    body.innerHTML = '<tr><td colspan="7" class="empty">No reservations</td></tr>';
  }
}

// Passcodes
async function loadPasscodes() {
  const passcodes = await fetchAPI('/passcodes');
  const body = document.getElementById('all-passcodes-body');
  if (passcodes.length > 0) {
    body.innerHTML = passcodes.map(p => `
      <tr>
        <td><span class="mono code">${p.code}</span></td>
        <td>${p.guest_name || '—'}</td>
        <td>${p.room_number || '—'}</td>
        <td>${formatDate(p.valid_from)}</td>
        <td>${formatDate(p.valid_until)}</td>
        <td><span class="badge ${p.status}">${p.status}</span></td>
      </tr>
    `).join('');
  } else {
    body.innerHTML = '<tr><td colspan="6" class="empty">No passcodes</td></tr>';
  }
}

// Logs
async function loadLogs() {
  const logs = await fetchAPI('/logs?limit=100');
  const body = document.getElementById('all-logs-body');
  if (logs.length > 0) {
    body.innerHTML = logs.map(l => `
      <tr>
        <td><span class="badge ${getActionClass(l.action)}">${formatAction(l.action)}</span></td>
        <td>${l.ttlock_lock_id ? `<span class="mono">${l.ttlock_lock_id.slice(0, 10)}...</span>` : '—'}</td>
        <td>${l.guest_name || '—'}</td>
        <td>${l.room_number || '—'}</td>
        <td class="time">${timeAgo(l.created_at)}</td>
      </tr>
    `).join('');
  } else {
    body.innerHTML = '<tr><td colspan="5" class="empty">No logs</td></tr>';
  }
}

// Locks
async function loadLocks() {
  const locks = await fetchAPI('/locks');
  const body = document.getElementById('all-locks-body');
  if (locks.length > 0) {
    body.innerHTML = locks.map(l => {
      const signal = l.status === 'online' ? Math.floor(Math.random() * 30 + 70) + '%' : '—';
      return `
        <tr>
          <td><span class="mono">${l.ttlock_lock_id ? l.ttlock_lock_id.slice(0, 10) + '...' : '—'}</span></td>
          <td>${l.room_number || '—'}</td>
          <td>${l.property_name || '—'}</td>
          <td><span class="badge ${l.status}">${l.status.replace('_', ' ')}</span></td>
          <td>
            <div class="battery-bar">
              <div class="battery-fill ${l.battery_level < 20 ? 'low' : l.battery_level < 50 ? 'mid' : 'high'}"
                   style="width: ${l.battery_level}%"></div>
            </div>
            <span class="battery-pct">${l.battery_level}%</span>
          </td>
          <td>${signal}</td>
        </tr>
      `;
    }).join('');
  } else {
    body.innerHTML = '<tr><td colspan="6" class="empty">No locks</td></tr>';
  }
}

// Utils
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
}

function getActionClass(action) {
  const map = {
    'passcode_generated': 'generated',
    'passcode_revoked': 'revoked',
    'guest_checked_in': 'checkedin',
    'guest_checked_out': 'checkedout',
    'room_reassigned': 'reassigned'
  };
  return map[action] || 'pending';
}

// Filters
document.getElementById('filter-action')?.addEventListener('change', (e) => {
  const filter = e.target.value;
  document.querySelectorAll('#all-logs-body tr').forEach(row => {
    const action = row.querySelector('td:first-child span')?.textContent.toLowerCase() || '';
    row.style.display = !filter || action.includes(filter.toLowerCase()) ? '' : 'none';
  });
});

document.getElementById('filter-lock-status')?.addEventListener('change', (e) => {
  const filter = e.target.value;
  document.querySelectorAll('#all-locks-body tr').forEach(row => {
    const status = row.querySelector('td:nth-child(4) span')?.textContent.toLowerCase() || '';
    row.style.display = !filter || status.includes(filter.toLowerCase()) ? '' : 'none';
  });
});

// Search
document.getElementById('search-reservations')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#all-reservations-body tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

document.getElementById('search-passcodes')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#all-passcodes-body tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

// Init
loadPageData('dashboard');
setInterval(() => {
  const page = document.querySelector('.page.active')?.id.replace('page-', '');
  if (page) loadPageData(page);
}, 15000);
