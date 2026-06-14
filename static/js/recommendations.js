async function getRecommendations() {
  const btn = document.getElementById('recBtnText');
  btn.textContent = '⏳ Analysing your terrace…';

  const payload = {
    size: document.getElementById('recSize').value,
    soil: document.getElementById('recSoil').value,
    sunlight: document.getElementById('recSunlight').value,
    location: document.getElementById('recLocation').value || 'Chennai'
  };

  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      renderWeather(data.weather, 'weatherInfo');
      renderCrops(data.recommended_crops, 'cropCards');
      document.getElementById('recResults').style.display = 'block';
      document.getElementById('recResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error(err);
  }
  btn.textContent = '🔍 Get AI Recommendations';
}

function renderWeather(w, containerId) {
  const el = document.getElementById(containerId);
  if (!w) { el.style.display = 'none'; return; }
  el.innerHTML = `
    <span>📍 ${w.city}</span>
    <span>🌡️ ${Math.round(w.temperature)}°C</span>
    <span>💧 Humidity: ${w.humidity}%</span>
    <span>☁️ ${w.description}</span>
  `;
}

function renderCrops(crops, containerId) {
  const el = document.getElementById(containerId);
  if (!crops || crops.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No crops matched your conditions. Try adjusting your inputs.</p>';
    return;
  }
  el.innerHTML = crops.map(c => `
    <div class="crop-card">
      <div class="crop-card-emoji">${c.emoji}</div>
      <div class="crop-card-name">${c.name}</div>
      <div class="crop-card-score">✅ ${c.success_probability}% success rate</div>
      <div class="crop-card-desc">${c.description}</div>
      <div class="crop-card-tags">
        <span class="tag">⏱ ${c.days_to_harvest} days</span>
        <span class="tag">💧 ${c.water_needs}</span>
        <span class="tag">📊 ${c.difficulty}</span>
      </div>
      <button class="add-btn" onclick="addToGarden('${c.name}')">+ Add to My Garden</button>
    </div>
  `).join('');
}

function addToGarden(cropName) {
  const user = JSON.parse(localStorage.getItem('et_user') || 'null');
  if (!user) {
    openModal('registerModal');
    return;
  }
  fetch('/api/garden', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop_name: cropName })
  }).then(() => {
    alert(`🌱 ${cropName} added to your garden!`);
  });
}
