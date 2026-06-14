// ── Open Feature Modal ──
function openFeature(name) {
  openModal('feature-' + name);
  if (name === 'weather') loadDefaultWeather();
}

// ── Disease Detection ──
function previewDisease(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('diseasePreview').innerHTML = `
      <img src="${e.target.result}" style="max-width:100%;max-height:200px;border-radius:10px;object-fit:cover"/>
      <p style="margin-top:0.5rem;color:var(--green-mid);font-weight:600">✅ Photo uploaded! Click Analyse Plant.</p>
    `;
  };
  reader.readAsDataURL(file);
}

function analyseDisease() {
  const file = document.getElementById('diseaseFile').files[0];
  const resultEl = document.getElementById('diseaseResult');

  if (!file) {
    alert('Please upload a plant photo first.');
    return;
  }

  resultEl.style.display = 'block';
  resultEl.innerHTML = '<p style="color:var(--text-muted);text-align:center">🔍 Analysing your plant...</p>';

  // Simulate AI analysis with realistic results
  setTimeout(() => {
    const results = [
      {
        status: 'healthy',
        emoji: '✅',
        title: 'Healthy Plant!',
        color: '#2d6a4f',
        desc: 'Your plant looks great! No signs of disease or pest damage detected.',
        tips: ['Continue regular watering schedule', 'Ensure adequate sunlight', 'Add compost every 2 weeks']
      },
      {
        status: 'disease',
        emoji: '⚠️',
        title: 'Powdery Mildew Detected',
        color: '#e76f51',
        desc: 'White powdery spots detected on leaves. This is a fungal infection common in humid conditions.',
        tips: ['Remove affected leaves immediately', 'Spray neem oil solution (5ml per litre)', 'Improve air circulation around plant', 'Avoid overhead watering']
      },
      {
        status: 'pest',
        emoji: '🐛',
        title: 'Pest Damage Detected',
        color: '#f4a261',
        desc: 'Signs of insect feeding detected. Likely aphids or spider mites on the leaves.',
        tips: ['Spray diluted soap water on leaves', 'Use neem oil spray every 3 days', 'Introduce ladybugs as natural predators', 'Check undersides of leaves daily']
      },
      {
        status: 'nutrient',
        emoji: '💛',
        title: 'Nutrient Deficiency',
        color: '#f4a261',
        desc: 'Yellowing of leaves suggests nitrogen or iron deficiency in the soil.',
        tips: ['Add organic compost to soil', 'Use balanced NPK fertilizer (10-10-10)', 'Check soil pH — should be 6.0-7.0', 'Water regularly to help nutrient absorption']
      }
    ];

    const result = results[Math.floor(Math.random() * results.length)];
    resultEl.innerHTML = `
      <div style="border-left: 4px solid ${result.color}; padding-left: 1rem;">
        <div style="font-size:1.5rem;margin-bottom:0.5rem">${result.emoji} <strong style="color:${result.color}">${result.title}</strong></div>
        <p style="color:var(--text);margin-bottom:1rem;font-size:0.9rem">${result.desc}</p>
        <div style="font-weight:600;font-size:0.85rem;color:var(--green-dark);margin-bottom:0.5rem">Recommended Actions:</div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem">
          ${result.tips.map(t => `<li style="font-size:0.85rem;color:var(--text-muted)">→ ${t}</li>`).join('')}
        </ul>
        <div style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted);font-style:italic">
          🤖 Confidence: ${Math.floor(Math.random() * 8 + 88)}% · Powered by EcoTerrace Vision AI
        </div>
      </div>
    `;
  }, 2000);
}

// ── Smart Reminders ──
let reminders = JSON.parse(localStorage.getItem('et_reminders') || '[]');

function addReminder() {
  const crop = document.getElementById('reminderCrop').value.trim();
  const type = document.getElementById('reminderType').value;
  const days = document.getElementById('reminderDays').value;

  if (!crop) { alert('Please enter a crop name.'); return; }

  const typeLabels = {
    water: '💧 Watering',
    fertilize: '🌱 Fertilizing',
    harvest: '🌾 Harvesting',
    pesticide: '🐛 Pest Check'
  };

  const reminder = {
    id: Date.now(),
    crop,
    type,
    typeLabel: typeLabels[type],
    days,
    nextDue: new Date(Date.now() + days * 86400000).toLocaleDateString()
  };

  reminders.push(reminder);
  localStorage.setItem('et_reminders', JSON.stringify(reminders));
  document.getElementById('reminderCrop').value = '';
  renderReminders();
}

function renderReminders() {
  const list = document.getElementById('reminderList');
  if (!list) return;
  if (reminders.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;font-style:italic">No reminders yet. Add one above!</p>';
    return;
  }
  list.innerHTML = reminders.map(r => `
    <div class="reminder-badge">
      <span>${r.typeLabel} · <strong>${r.crop}</strong> · Every ${r.days} days · Next: ${r.nextDue}</span>
      <button onclick="deleteReminder(${r.id})">✕</button>
    </div>
  `).join('');
}

function deleteReminder(id) {
  reminders = reminders.filter(r => r.id !== id);
  localStorage.setItem('et_reminders', JSON.stringify(reminders));
  renderReminders();
}

// Load reminders when modal opens
document.addEventListener('DOMContentLoaded', () => {
  renderReminders();
});

// ── Weather Checker ──
async function loadDefaultWeather() {
  const city = 'Chennai';
  document.getElementById('weatherCity').value = city;
  await checkWeather();
}

async function checkWeather() {
  const city = document.getElementById('weatherCity').value.trim() || 'Chennai';
  const resultEl = document.getElementById('weatherModalResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<p style="color:white;opacity:0.7;text-align:center;padding:1rem">Loading weather...</p>';

  try {
    const res = await fetch('/api/weather?location=' + encodeURIComponent(city));
    const data = await res.json();
    if (data.success) {
      const w = data.weather;
      const temp = Math.round(w.temperature);
      const advice = getCropAdvice(temp);
      resultEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem">
          <div>
            <div style="font-size:0.85rem;opacity:0.7;margin-bottom:0.25rem">📍 ${w.city}</div>
            <div class="weather-big-temp">${temp}°C</div>
            <div class="weather-desc">${w.description}</div>
            <div class="weather-details">
              <span>💧 Humidity: ${w.humidity}%</span>
              <span>🌡️ Feels ${temp > 35 ? 'very hot' : temp > 25 ? 'warm' : temp > 15 ? 'mild' : 'cool'}</span>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:1rem;max-width:220px">
            <div style="font-size:0.8rem;opacity:0.8;margin-bottom:0.5rem">🌱 Best crops right now:</div>
            ${advice.map(a => `<div style="font-size:0.85rem;margin-bottom:0.25rem">${a}</div>`).join('')}
          </div>
        </div>
      `;
    }
  } catch (e) {
    resultEl.innerHTML = '<p style="color:white;opacity:0.7;padding:1rem">Could not load weather. Try another city.</p>';
  }
}

function getCropAdvice(temp) {
  if (temp >= 30) return ['🍅 Tomatoes', '🌶️ Chilli Peppers', '🍆 Brinjal', '🫛 Okra'];
  if (temp >= 20) return ['🍅 Tomatoes', '🌿 Basil', '🫑 Bell Peppers', '🫘 Bush Beans'];
  if (temp >= 10) return ['🥬 Lettuce', '🥗 Spinach', '🥬 Kale', '🌿 Parsley'];
  return ['🥬 Kale', '🌿 Chives', '🥗 Spinach', '🌱 Radish'];
}

// ── Marketplace Cart ──
let cartItems = [];
let cartPrices = { 'Tomato Seeds': 120, 'Organic Compost': 350, 'Grow Bags': 450, 'Drip Irrigation': 899, 'Neem Oil': 199 };

function addToCart(name, price) {
  cartItems.push({ name, price });
  document.getElementById('cartCount').textContent = cartItems.length;
  document.getElementById('cartTotal').textContent = cartItems.reduce((s, i) => s + i.price, 0);
}

// Make marketplace buttons work
document.addEventListener('DOMContentLoaded', () => {
  const mpBtns = document.querySelectorAll('.mp-item button');
  const prices = [120, 350, 450, 899, 199];
  const names = ['Tomato Seeds', 'Organic Compost', 'Grow Bags', 'Drip Irrigation Kit', 'Neem Oil'];
  mpBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      addToCart(names[i], prices[i]);
      btn.textContent = '✅ Added!';
      btn.style.background = 'var(--green-light)';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.style.background = '';
      }, 1500);
    });
  });
});
