// ═══════════════════════════════════════════
// 🔔 NOTIFICATION BELL
// ═══════════════════════════════════════════
function toggleNotifications() {
  const dd = document.getElementById('notifDropdown');
  dd.classList.toggle('open');
  document.getElementById('notifCount').style.display = 'none';
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.notif-bell')) {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.classList.remove('open');
  }
});

// ═══════════════════════════════════════════
// 📅 GARDEN CALENDAR
// ═══════════════════════════════════════════
let calDate = new Date();
let calEvents = JSON.parse(localStorage.getItem('et_cal_events') || '[]');

const evColors = { plant: '#52b788', water: '#4895ef', harvest: '#f4a261', fertilize: '#e76f51' };
const evEmojis = { plant: '🌱', water: '💧', harvest: '🌾', fertilize: '🌿' };

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthTitle').textContent = `${months[calDate.getMonth()]} ${calDate.getFullYear()}`;

  const grid = document.getElementById('calendarGrid');
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    const dayEvents = calEvents.filter(e => e.date === dateStr);
    const dots = dayEvents.map(e => `<span class="cal-dot" style="background:${evColors[e.type]}" title="${e.crop}: ${e.type}"></span>`).join('');
    html += `<div class="cal-cell ${isToday ? 'today' : ''}" onclick="showDayEvents('${dateStr}')">
      <span class="cal-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  grid.innerHTML = html;

  // Set today as default date for new events
  const todayStr = today.toISOString().split('T')[0];
  if (document.getElementById('evDate')) document.getElementById('evDate').value = todayStr;
}

function changeMonth(dir) {
  calDate.setMonth(calDate.getMonth() + dir);
  renderCalendar();
}

function addCalendarEvent() {
  const date = document.getElementById('evDate').value;
  const crop = document.getElementById('evCrop').value.trim();
  const type = document.getElementById('evType').value;
  if (!date || !crop) { alert('Please fill in date and crop name.'); return; }

  calEvents.push({ id: Date.now(), date, crop, type });
  localStorage.setItem('et_cal_events', JSON.stringify(calEvents));
  document.getElementById('evCrop').value = '';
  renderCalendar();
  alert(`${evEmojis[type]} ${crop} event added on ${date}!`);
}

function showDayEvents(dateStr) {
  const dayEvs = calEvents.filter(e => e.date === dateStr);
  if (dayEvs.length === 0) return;
  const list = dayEvs.map(e => `${evEmojis[e.type]} ${e.crop} — ${e.type}`).join('\n');
  alert(`Events on ${dateStr}:\n\n${list}`);
}

// ═══════════════════════════════════════════
// 📊 YIELD TRACKER
// ═══════════════════════════════════════════
let harvests = JSON.parse(localStorage.getItem('et_harvests') || '[]');

function logHarvest() {
  const crop = document.getElementById('yieldCrop').value.trim();
  const kg = parseFloat(document.getElementById('yieldKg').value);
  const price = parseFloat(document.getElementById('yieldPrice').value);
  const date = document.getElementById('yieldDate').value;

  if (!crop || !kg || !date) { alert('Please fill in crop, weight and date.'); return; }

  harvests.push({ id: Date.now(), crop, kg, price: price || 80, date });
  localStorage.setItem('et_harvests', JSON.stringify(harvests));

  document.getElementById('yieldCrop').value = '';
  document.getElementById('yieldKg').value = '';
  document.getElementById('yieldPrice').value = '';
  renderYield();
}

function renderYield() {
  const totalKg = harvests.reduce((s, h) => s + h.kg, 0);
  const totalRs = harvests.reduce((s, h) => s + (h.kg * h.price), 0);

  document.getElementById('totalYieldKg').textContent = totalKg.toFixed(1);
  document.getElementById('totalYieldRs').textContent = '₹' + Math.round(totalRs);
  document.getElementById('totalHarvests').textContent = harvests.length;

  // Best crop
  const cropMap = {};
  harvests.forEach(h => { cropMap[h.crop] = (cropMap[h.crop] || 0) + h.kg; });
  const best = Object.entries(cropMap).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('bestCrop').textContent = best ? best[0] : '—';

  // Update KPI in overview
  if (document.getElementById('kpiYield')) document.getElementById('kpiYield').textContent = totalKg.toFixed(1) + ' kg';
  if (document.getElementById('kpiSaved')) document.getElementById('kpiSaved').textContent = '₹' + Math.round(totalRs);

  const list = document.getElementById('yieldList');
  if (!list) return;
  if (harvests.length === 0) {
    list.innerHTML = '<p class="empty-state">No harvests logged yet. Log your first harvest above!</p>';
    return;
  }
  list.innerHTML = `
    <table class="yield-table">
      <thead><tr><th>Crop</th><th>Weight</th><th>Price/kg</th><th>Value</th><th>Date</th><th></th></tr></thead>
      <tbody>
        ${[...harvests].reverse().map(h => `
          <tr>
            <td><strong>${h.crop}</strong></td>
            <td>${h.kg} kg</td>
            <td>₹${h.price}</td>
            <td style="color:var(--green-mid);font-weight:700">₹${Math.round(h.kg * h.price)}</td>
            <td>${h.date}</td>
            <td><button onclick="deleteHarvest(${h.id})" style="background:none;border:none;cursor:pointer;color:var(--text-muted)">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function deleteHarvest(id) {
  harvests = harvests.filter(h => h.id !== id);
  localStorage.setItem('et_harvests', JSON.stringify(harvests));
  renderYield();
}

// ═══════════════════════════════════════════
// 🌱 CROP GROWTH TIMELINE
// ═══════════════════════════════════════════
const cropData = {
  Tomatoes: { days: 75, emoji: '🍅', stages: [
    { day: 0, label: 'Sow Seeds', desc: 'Plant seeds 1cm deep in seed tray', icon: '🌱' },
    { day: 7, label: 'Germination', desc: 'Seedlings emerge. Ensure warm temp 22-28°C', icon: '🌿' },
    { day: 21, label: 'Transplant', desc: 'Move to larger pot or grow bag', icon: '🪴' },
    { day: 35, label: 'Vegetative', desc: 'Add support stake. Start weekly fertilizing', icon: '🌳' },
    { day: 50, label: 'Flowering', desc: 'Yellow flowers appear. Pollinate gently', icon: '🌼' },
    { day: 65, label: 'Fruiting', desc: 'Green fruits forming. Increase watering', icon: '🍅' },
    { day: 75, label: 'Harvest!', desc: 'Tomatoes turn red. Harvest when firm-ripe', icon: '🏆' }
  ]},
  Chilli: { days: 90, emoji: '🌶️', stages: [
    { day: 0, label: 'Sow Seeds', desc: 'Sow seeds in warm soil. Cover lightly.', icon: '🌱' },
    { day: 10, label: 'Germination', desc: 'Keep soil moist. Needs 25-30°C', icon: '🌿' },
    { day: 25, label: 'Transplant', desc: 'Move seedling to 12-inch pot', icon: '🪴' },
    { day: 45, label: 'Branching', desc: 'Plant branches out. Add NPK fertilizer', icon: '🌳' },
    { day: 60, label: 'Flowering', desc: 'White flowers appear. Avoid overwatering', icon: '🌼' },
    { day: 75, label: 'Fruiting', desc: 'Green chillis forming. Wait for color change', icon: '🌶️' },
    { day: 90, label: 'Harvest!', desc: 'Pick when fully red or green as preferred', icon: '🏆' }
  ]},
  Spinach: { days: 40, emoji: '🥬', stages: [
    { day: 0, label: 'Sow Seeds', desc: 'Direct sow in shallow rows. Water gently.', icon: '🌱' },
    { day: 5, label: 'Germination', desc: 'Sprouts appear. Keep in partial shade', icon: '🌿' },
    { day: 15, label: 'Thinning', desc: 'Thin seedlings to 10cm apart', icon: '🪴' },
    { day: 25, label: 'Leaf Growth', desc: 'Leaves expanding. Add nitrogen fertilizer', icon: '🥬' },
    { day: 40, label: 'Harvest!', desc: 'Pick outer leaves. Plant keeps producing!', icon: '🏆' }
  ]},
  Mint: { days: 30, emoji: '🌿', stages: [
    { day: 0, label: 'Plant Cutting', desc: 'Place stem cutting in water for 1 week', icon: '🌱' },
    { day: 7, label: 'Root Growth', desc: 'Roots form. Transfer to pot with soil', icon: '🌿' },
    { day: 14, label: 'Establishment', desc: 'Plant settles. Water regularly', icon: '🪴' },
    { day: 30, label: 'Harvest!', desc: 'Trim tops regularly to encourage bushy growth', icon: '🏆' }
  ]},
  Okra: { days: 60, emoji: '🫛', stages: [
    { day: 0, label: 'Sow Seeds', desc: 'Soak seeds overnight. Sow 2cm deep.', icon: '🌱' },
    { day: 7, label: 'Germination', desc: 'Seedlings emerge in warm soil (25°C+)', icon: '🌿' },
    { day: 20, label: 'Transplant', desc: 'Move to large container minimum 30cm deep', icon: '🪴' },
    { day: 35, label: 'Vegetative', desc: 'Fast growing. Add compost every 2 weeks', icon: '🌳' },
    { day: 50, label: 'Flowering', desc: 'Yellow hibiscus-like flowers. Very beautiful!', icon: '🌼' },
    { day: 60, label: 'Harvest!', desc: 'Pick pods when 7-10cm long. Harvest daily!', icon: '🏆' }
  ]},
  Coriander: { days: 21, emoji: '🌿', stages: [
    { day: 0, label: 'Sow Seeds', desc: 'Crush seeds gently. Sow densely in tray', icon: '🌱' },
    { day: 5, label: 'Germination', desc: 'Sprouts in 5-7 days. Keep moist', icon: '🌿' },
    { day: 14, label: 'Leaf Growth', desc: 'Leaves appear. Thin if overcrowded', icon: '🪴' },
    { day: 21, label: 'Harvest!', desc: 'Snip leaves from top. Re-sow every 3 weeks', icon: '🏆' }
  ]}
};

function renderTimeline() {
  const cropName = document.getElementById('timelineCrop').value;
  const startDate = document.getElementById('timelineStart').value;
  const crop = cropData[cropName];
  if (!crop) return;

  const start = startDate ? new Date(startDate) : new Date();
  const today = new Date();
  const daysPassed = Math.floor((today - start) / 86400000);

  let html = `
    <div class="timeline-crop-header">
      <span style="font-size:2rem">${crop.emoji}</span>
      <div>
        <strong>${cropName}</strong> · ${crop.days} days total
        ${startDate ? `<br><span style="color:var(--text-muted);font-size:0.85rem">Day ${Math.max(0,daysPassed)} of ${crop.days} · ${Math.round(Math.max(0,Math.min(100,daysPassed/crop.days*100)))}% complete</span>` : ''}
      </div>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width:${Math.min(100,Math.max(0,daysPassed/crop.days*100))}%"></div>
    </div>
    <div class="timeline-stages">
  `;

  crop.stages.forEach((stage, i) => {
    const stageDate = startDate ? new Date(start.getTime() + stage.day * 86400000) : null;
    const isPast = daysPassed >= stage.day;
    const isCurrent = i < crop.stages.length - 1
      ? daysPassed >= stage.day && daysPassed < crop.stages[i+1].day
      : daysPassed >= stage.day;

    html += `
      <div class="timeline-stage ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}">
        <div class="ts-icon">${stage.icon}</div>
        <div class="ts-line"></div>
        <div class="ts-content">
          <div class="ts-day">Day ${stage.day}</div>
          <div class="ts-label">${stage.label} ${isCurrent ? '<span class="ts-badge">You are here!</span>' : ''}</div>
          <div class="ts-desc">${stage.desc}</div>
          ${stageDate ? `<div class="ts-date">📅 ${stageDate.toLocaleDateString()}</div>` : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';
  document.getElementById('timelineWrap').innerHTML = html;
}

// ═══════════════════════════════════════════
// 🗺️ GARDEN MAP
// ═══════════════════════════════════════════
const mapPlants = [
  { emoji: '🍅', name: 'Tomatoes' }, { emoji: '🌶️', name: 'Chilli' },
  { emoji: '🌿', name: 'Mint' }, { emoji: '🥬', name: 'Spinach' },
  { emoji: '🍆', name: 'Brinjal' }, { emoji: '🌱', name: 'Basil' },
  { emoji: '🫛', name: 'Okra' }, { emoji: '🧅', name: 'Onion' },
  { emoji: '🍓', name: 'Strawberry' }, { emoji: '🫑', name: 'Pepper' },
];

let selectedPlant = null;
let gridData = JSON.parse(localStorage.getItem('et_garden_map') || '{}');

function initGardenMap() {
  // Plant picker
  const picker = document.getElementById('plantPicker');
  if (!picker) return;
  picker.innerHTML = mapPlants.map(p => `
    <div class="plant-pick-item" onclick="selectMapPlant('${p.emoji}','${p.name}',this)" title="${p.name}">
      ${p.emoji}
    </div>
  `).join('');

  // Grid (6x8)
  const grid = document.getElementById('gardenGrid');
  grid.innerHTML = '';
  for (let i = 0; i < 48; i++) {
    const cell = document.createElement('div');
    cell.className = 'map-cell';
    cell.dataset.idx = i;
    if (gridData[i]) {
      cell.innerHTML = `<span title="${gridData[i].name}">${gridData[i].emoji}</span>`;
      cell.classList.add('filled');
    }
    cell.addEventListener('click', () => placeOnMap(i, cell));
    grid.appendChild(cell);
  }
}

function selectMapPlant(emoji, name, el) {
  document.querySelectorAll('.plant-pick-item').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedPlant = { emoji, name };
}

function placeOnMap(idx, cell) {
  if (!selectedPlant) { alert('Pick a plant from the list first!'); return; }
  gridData[idx] = selectedPlant;
  localStorage.setItem('et_garden_map', JSON.stringify(gridData));
  cell.innerHTML = `<span title="${selectedPlant.name}">${selectedPlant.emoji}</span>`;
  cell.classList.add('filled');
}

function clearMap() {
  if (!confirm('Clear the entire garden map?')) return;
  gridData = {};
  localStorage.setItem('et_garden_map', JSON.stringify(gridData));
  initGardenMap();
}

// ═══════════════════════════════════════════
// 👤 PROFILE
// ═══════════════════════════════════════════
let profileData = JSON.parse(localStorage.getItem('et_profile') || '{}');

function loadProfile() {
  const user = JSON.parse(localStorage.getItem('et_user') || '{}');
  document.getElementById('profName').value = profileData.name || user.name || '';
  document.getElementById('profEmail').value = profileData.email || user.email || '';
  document.getElementById('profLocation').value = profileData.location || 'Chennai';
  document.getElementById('profSize').value = profileData.size || '50';
  document.getElementById('profSoil').value = profileData.soil || 'loamy';
  document.getElementById('profSunlight').value = profileData.sunlight || 'full';
  if (profileData.avatar) document.getElementById('profileAvatar').textContent = profileData.avatar;
  if (profileData.exp) {
    document.querySelectorAll('.exp-opt').forEach(e => {
      if (e.textContent.toLowerCase().includes(profileData.exp)) e.classList.add('selected');
    });
  }
}

function setAvatar(emoji) {
  document.getElementById('profileAvatar').textContent = emoji;
  profileData.avatar = emoji;
}

function setExp(level, el) {
  document.querySelectorAll('.exp-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  profileData.exp = level;
}

function saveProfile() {
  profileData.name = document.getElementById('profName').value;
  profileData.email = document.getElementById('profEmail').value;
  profileData.location = document.getElementById('profLocation').value;
  profileData.size = document.getElementById('profSize').value;
  profileData.soil = document.getElementById('profSoil').value;
  profileData.sunlight = document.getElementById('profSunlight').value;
  localStorage.setItem('et_profile', JSON.stringify(profileData));

  // Update sidebar
  if (profileData.name) document.getElementById('sidebarName').textContent = profileData.name;
  if (profileData.location) document.getElementById('sidebarLoc').textContent = '📍 ' + profileData.location;

  const msg = document.getElementById('profileMsg');
  msg.textContent = '✅ Profile saved successfully!';
  msg.style.display = 'block';
  setTimeout(() => msg.style.display = 'none', 3000);
}

// ═══════════════════════════════════════════
// INIT ALL ON TAB LOAD
// ═══════════════════════════════════════════
const tabInitMap = {
  calendar: () => renderCalendar(),
  yield: () => renderYield(),
  timeline: () => {
    document.getElementById('timelineStart').value = new Date().toISOString().split('T')[0];
    renderTimeline();
  },
  gardenmap: () => initGardenMap(),
  profile: () => loadProfile(),
};

// Override showTab from dashboard.js to also init new features
const _origShowTab = window.showTab;
window.showTab = function(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(n => n.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (el) el.classList.add('active');
  if (tabInitMap[name]) tabInitMap[name]();
  if (name === 'mygarden') loadGarden();
  if (name === 'crops') loadCropLibrary();
  if (name === 'overview') loadGardenOverview();
};

// Init on page load
window.addEventListener('DOMContentLoaded', () => {
  renderYield();
});
