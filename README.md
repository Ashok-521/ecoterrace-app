# 🌿 EcoTerrace — AI-Powered Urban Farming Platform

A full-stack web application built with Flask + SQLite/PostgreSQL + HTML/CSS/JS.

---

## 🚀 Quick Setup (Run Locally)

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the app
```bash
python app.py
```

### 3. Open in browser
```
http://localhost:5000
```

That's it! The database is created automatically on first run.

---

## 📁 Project Structure
```
ecoterrace/
├── app.py                  # Flask backend (all APIs)
├── requirements.txt        # Python dependencies
├── templates/
│   ├── base.html           # Base layout + navbar + modals
│   ├── index.html          # Landing page + AI recommender
│   ├── dashboard.html      # User dashboard
│   └── community.html      # Community forum
└── static/
    ├── css/
    │   └── main.css        # Full design system
    └── js/
        ├── auth.js         # Login / Register
        ├── recommendations.js  # AI crop recommender
        ├── dashboard.js    # Dashboard logic
        └── community.js    # Forum logic
```

---

## 🌐 Deploy to Render (Free)

1. Push this folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
5. Add environment variable: `DATABASE_URL` (optional, uses SQLite by default)

---

## 🔑 Features
- ✅ AI Crop Recommendations (weather + soil + sunlight + space)
- ✅ Real-time weather via OpenWeatherMap API
- ✅ User registration & login
- ✅ My Garden tracker
- ✅ Community Forum with comments
- ✅ Crop Library (10 Indian crops)
- ✅ Mobile responsive design
- ✅ SQLite (dev) / PostgreSQL (production) support

---

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python 3.9+, Flask 3.0 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy |
| Frontend | HTML5, CSS3, Vanilla JS |
| Weather API | OpenWeatherMap |
| Fonts | Google Fonts (DM Sans + Playfair Display) |
