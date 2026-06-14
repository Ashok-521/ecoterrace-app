// ── Tab Switching ──
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'mygarden') loadGarden();
  if (name === 'crops') loadCropLibrary();
}

// ── Init ──
window.addEventListener('DOMContentLoaded', async () => {
  loadUserInfo();
  loadWeather();
  loadGardenOverview();
});

function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (user) {
    document.getElementById('sidebarName').textContent = user.name;
  }
}

async function loadWeather() {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  const location = user?.location || 'Chennai';
  document.getElementById('sidebarLoc').textContent = '📍 ' + location;

  try {
    const res = await fetch('/api/weather?location=' + encodeURIComponent(location));
    const data = await res.json();
    if (data.success) {
      const w = data.weather;
      document.getElementById('sidebarWeather').innerHTML = `
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;margin-bottom:0.5rem">Weather</div>
        <div style="font-size:1.4rem;font-weight:700">${Math.round(w.temperature)}°C</div>
        <div style="opacity:0.8;font-size:0.85rem">${w.description}</div>
        <div style="opacity:0.7;font-size:0.8rem;margin-top:0.25rem">💧 Humidity: ${w.humidity}%</div>
      `;
    }
  } catch (e) {
    document.getElementById('sidebarWeather').innerHTML = '<div style="opacity:0.5;font-size:0.8rem">Weather unavailable</div>';
  }
}

async function loadGardenOverview() {
  try {
    const res = await fetch('/api/garden');
    const data = await res.json();
    const plants = data.schedules || [];
    document.getElementById('kpiPlants').textContent = plants.length;

    const container = document.getElementById('overviewPlants');
    if (plants.length === 0) {
      container.innerHTML = '<p class="empty-state">No plants added yet. <span onclick="showTabDirect(\'mygarden\')">Add one →</span></p>';
    } else {
      container.innerHTML = plants.slice(0, 4).map(p => `
        <div class="garden-item">
          <div class="gi-info">
            <div class="gi-name">🌱 ${p.crop_name}</div>
            <div class="gi-date">Planted: ${new Date(p.planted_date).toLocaleDateString()}</div>
          </div>
          <span class="gi-status">${p.status}</span>
        </div>
      `).join('');
    }
  } catch (e) {}
}

async function loadGarden() {
  try {
    const res = await fetch('/api/garden');
    const data = await res.json();
    const plants = data.schedules || [];
    const list = document.getElementById('gardenList');

    if (plants.length === 0) {
      list.innerHTML = '<p class="empty-state">Your garden is empty. Add your first plant above!</p>';
      return;
    }
    list.innerHTML = plants.map(p => `
      <div class="garden-item">
        <div class="gi-info">
          <div class="gi-name">🌱 ${p.crop_name}</div>
          <div class="gi-date">Planted: ${new Date(p.planted_date).toLocaleDateString()} ${p.notes ? '· ' + p.notes : ''}</div>
        </div>
        <span class="gi-status">${p.status}</span>
      </div>
    `).join('');
  } catch (e) {}
}

async function addPlant() {
  const name = document.getElementById('newCropName').value.trim();
  const notes = document.getElementById('newCropNotes').value.trim();
  if (!name) return;

  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (!user) { openModal('loginModal'); return; }

  await fetch('/api/garden', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop_name: name, notes })
  });

  document.getElementById('newCropName').value = '';
  document.getElementById('newCropNotes').value = '';
  loadGarden();
  loadGardenOverview();
}

async function loadCropLibrary() {
  try {
    const res = await fetch('/api/crops');
    const data = await res.json();
    const crops = data.crops || [];
    document.getElementById('cropLibrary').innerHTML = crops.map(c => `
      <div class="crop-card">
        <div class="crop-card-emoji">${c.emoji}</div>
        <div class="crop-card-name">${c.name}</div>
        <div class="crop-card-desc">${c.description}</div>
        <div class="crop-card-tags">
          <span class="tag">⏱ ${c.days_to_harvest} days</span>
          <span class="tag">📊 ${c.difficulty}</span>
        </div>
        <button class="add-btn" onclick="quickAddPlant('${c.name}')">+ Add to Garden</button>
      </div>
    `).join('');
  } catch (e) {}
}

async function quickAddPlant(name) {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (!user) { openModal('loginModal'); return; }
  await fetch('/api/garden', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop_name: name })
  });
  alert(`🌱 ${name} added to your garden!`);
  loadGardenOverview();
}

// Dashboard recommender
async function getDashRecommendations() {
  const payload = {
    size: document.getElementById('dRecSize').value,
    soil: document.getElementById('dRecSoil').value,
    sunlight: document.getElementById('dRecSunlight').value,
    location: document.getElementById('dRecLocation').value || 'Chennai'
  };

  const res = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.success) {
    renderDashWeather(data.weather);
    renderDashCrops(data.recommended_crops);
    document.getElementById('dRecResults').style.display = 'block';
  }
}

function renderDashWeather(w) {
  const el = document.getElementById('dWeatherInfo');
  if (!w) return;
  el.innerHTML = `<span>📍 ${w.city}</span> <span>🌡️ ${Math.round(w.temperature)}°C</span> <span>💧 ${w.humidity}%</span> <span>☁️ ${w.description}</span>`;
}

function renderDashCrops(crops) {
  const el = document.getElementById('dCropCards');
  if (!crops || crops.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted)">No matching crops found. Try adjusting your inputs.</p>';
    return;
  }
  el.innerHTML = crops.map(c => `
    <div class="crop-card">
      <div class="crop-card-emoji">${c.emoji}</div>
      <div class="crop-card-name">${c.name}</div>
      <div class="crop-card-score">✅ ${c.success_probability}% success</div>
      <div class="crop-card-desc">${c.description}</div>
      <div class="crop-card-tags">
        <span class="tag">⏱ ${c.days_to_harvest}d</span>
        <span class="tag">💧 ${c.water_needs}</span>
        <span class="tag">📊 ${c.difficulty}</span>
      </div>
      <button class="add-btn" onclick="quickAddPlant('${c.name}')">+ Add to Garden</button>
    </div>
  `).join('');
}

function showTabDirect(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'mygarden') loadGarden();
}
