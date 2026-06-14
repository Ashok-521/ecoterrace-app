from flask import Flask, request, jsonify, render_template, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import requests
import os

app = Flask(__name__)
app.secret_key = 'ecoterrace-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 'sqlite:///ecoterrace.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'a2fd88ad38939cb61fa26d46dac19b10')

# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    terrace_size = db.Column(db.Float, default=50.0)
    soil_type = db.Column(db.String(50), default='loamy')
    sunlight = db.Column(db.String(50), default='full')
    location = db.Column(db.String(100), default='Chennai')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    posts = db.relationship('ForumPost', backref='author', lazy=True)

class Crop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    soil_requirements = db.Column(db.String(200))
    sunlight_needs = db.Column(db.String(100))
    growing_season = db.Column(db.String(50))
    difficulty_level = db.Column(db.String(20))
    min_temp = db.Column(db.Float, default=10.0)
    max_temp = db.Column(db.Float, default=40.0)
    min_space = db.Column(db.Float, default=10.0)
    water_needs = db.Column(db.String(50), default='moderate')
    emoji = db.Column(db.String(10), default='🌱')
    description = db.Column(db.Text)
    days_to_harvest = db.Column(db.Integer, default=60)

class GardenSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    planted_date = db.Column(db.DateTime, default=datetime.utcnow)
    next_water = db.Column(db.DateTime)
    next_fertilize = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='growing')

class ForumPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    comments = db.relationship('Comment', backref='post', lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('forum_post.id'))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_weather_data(location):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'description': data['weather'][0]['description'],
                'city': data['name']
            }
    except Exception:
        pass
    # Fallback mock weather for demo
    return {'temperature': 28, 'humidity': 65, 'description': 'partly cloudy', 'city': location}

def is_temperature_suitable(crop, temp):
    return crop.min_temp <= temp <= crop.max_temp

def ai_recommendation_engine(soil, sunlight, location, size):
    weather = get_weather_data(location)
    temp = weather['temperature']
    humidity = weather['humidity']
    size = float(size) if size else 50

    suitable_crops = []
    for crop in Crop.query.all():
        if crop.min_space > size:
            continue
        soil_ok = (crop.soil_requirements == soil or crop.soil_requirements == 'any')
        sun_ok = (crop.sunlight_needs == sunlight or crop.sunlight_needs == 'any')
        temp_ok = is_temperature_suitable(crop, temp)
        if soil_ok and sun_ok and temp_ok:
            score = 70
            # Boost score based on how well temp fits (closer to middle = better)
            temp_mid = (crop.min_temp + crop.max_temp) / 2
            temp_fit = max(0, 10 - abs(temp - temp_mid))
            score += temp_fit
            if humidity > 60:
                score += 8
            if crop.difficulty_level == 'easy':
                score += 12
            # Bonus for crops that thrive in all seasons
            if crop.growing_season == 'all':
                score += 5
            suitable_crops.append({'crop': crop, 'score': score})

    suitable_crops.sort(key=lambda x: x['score'], reverse=True)
    result = []
    for item in suitable_crops[:5]:
        c = item['crop']
        result.append({
            'name': c.name,
            'emoji': c.emoji,
            'difficulty': c.difficulty_level,
            'days_to_harvest': c.days_to_harvest,
            'water_needs': c.water_needs,
            'description': c.description,
            'success_probability': min(item['score'], 98)
        })
    return result, weather

def seed_crops():
    if Crop.query.count() == 0:
        crops = [
            # ── INDIA / TROPICAL (20-42°C) ──
            Crop(name='Tomatoes', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=18, max_temp=35,
                 min_space=20, water_needs='moderate', emoji='🍅',
                 description='Perfect for terraces worldwide. Compact varieties thrive in containers.', days_to_harvest=75),
            Crop(name='Chilli Peppers', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='medium', min_temp=20, max_temp=40,
                 min_space=15, water_needs='low', emoji='🌶️',
                 description='Ideal for hot climates. Very productive in small spaces.', days_to_harvest=90),
            Crop(name='Okra', soil_requirements='clay', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=22, max_temp=42,
                 min_space=25, water_needs='moderate', emoji='🫛',
                 description='Thrives in tropical heat. High yield in terrace gardens.', days_to_harvest=60),
            Crop(name='Brinjal', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='medium', min_temp=20, max_temp=40,
                 min_space=30, water_needs='moderate', emoji='🍆',
                 description='Long fruiting season. Great for Indian & Middle Eastern climates.', days_to_harvest=80),
            Crop(name='Coriander', soil_requirements='any', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=10, max_temp=32,
                 min_space=5, water_needs='moderate', emoji='🌿',
                 description='Essential kitchen herb globally. Grows quickly, harvest repeatedly.', days_to_harvest=21),
            Crop(name='Bitter Gourd', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='medium', min_temp=24, max_temp=42,
                 min_space=30, water_needs='moderate', emoji='🥒',
                 description='Popular in South & Southeast Asia. Thrives in high heat.', days_to_harvest=70),
            Crop(name='Curry Leaf', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=18, max_temp=40,
                 min_space=10, water_needs='low', emoji='🍃',
                 description='Staple herb in Indian cooking. Hardy and low maintenance.', days_to_harvest=365),

            # ── UNIVERSAL / ALL CLIMATES (10-38°C) ──
            Crop(name='Mint', soil_requirements='any', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=10, max_temp=38,
                 min_space=5, water_needs='high', emoji='🌿',
                 description='Grows worldwide. Keep in pots to control spreading.', days_to_harvest=30),
            Crop(name='Basil', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=18, max_temp=35,
                 min_space=8, water_needs='moderate', emoji='🌱',
                 description='Used in Italian, Thai and Indian cooking. Fast growing.', days_to_harvest=30),
            Crop(name='Spring Onions', soil_requirements='any', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=8, max_temp=35,
                 min_space=5, water_needs='moderate', emoji='🧅',
                 description='Grow anywhere in the world. Harvest in just 3 weeks.', days_to_harvest=21),
            Crop(name='Radish', soil_requirements='sandy', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=5, max_temp=30,
                 min_space=5, water_needs='moderate', emoji='🌱',
                 description='One of the fastest crops globally. Ready in 3-4 weeks.', days_to_harvest=25),
            Crop(name='Cherry Tomatoes', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=16, max_temp=35,
                 min_space=15, water_needs='moderate', emoji='🍒',
                 description='Perfect container crop worldwide. Sweeter than regular tomatoes.', days_to_harvest=65),

            # ── EUROPE / USA / COOL CLIMATES (5-25°C) ──
            Crop(name='Lettuce', soil_requirements='loamy', sunlight_needs='partial',
                 growing_season='spring', difficulty_level='easy', min_temp=5, max_temp=22,
                 min_space=10, water_needs='high', emoji='🥬',
                 description='Perfect for European & US terraces. Harvest outer leaves continuously.', days_to_harvest=45),
            Crop(name='Spinach', soil_requirements='loamy', sunlight_needs='partial',
                 growing_season='spring', difficulty_level='easy', min_temp=3, max_temp=22,
                 min_space=10, water_needs='moderate', emoji='🥗',
                 description='Cool-climate superfood. Great for UK, Europe and northern USA.', days_to_harvest=40),
            Crop(name='Kale', soil_requirements='loamy', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=2, max_temp=22,
                 min_space=15, water_needs='moderate', emoji='🥬',
                 description='Superfood that survives frost. Ideal for cold climates like UK & Canada.', days_to_harvest=55),
            Crop(name='Strawberries', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='spring', difficulty_level='medium', min_temp=5, max_temp=26,
                 min_space=15, water_needs='moderate', emoji='🍓',
                 description='Perfect for balconies in Europe & USA. Sweet and rewarding.', days_to_harvest=90),
            Crop(name='Peas', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='spring', difficulty_level='easy', min_temp=5, max_temp=22,
                 min_space=20, water_needs='moderate', emoji='🫛',
                 description='Classic cool-season crop for Europe, UK and northern USA.', days_to_harvest=60),
            Crop(name='Parsley', soil_requirements='loamy', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=5, max_temp=25,
                 min_space=8, water_needs='moderate', emoji='🌿',
                 description='Essential European herb. Grows well in cool climates.', days_to_harvest=70),
            Crop(name='Chives', soil_requirements='any', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=3, max_temp=25,
                 min_space=5, water_needs='moderate', emoji='🌱',
                 description='Hardy herb for cool climates. Popular in Europe and North America.', days_to_harvest=30),
            Crop(name='Zucchini', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=15, max_temp=30,
                 min_space=40, water_needs='moderate', emoji='🥒',
                 description='Very productive in European and American summers.', days_to_harvest=55),
            Crop(name='Bell Peppers', soil_requirements='loamy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='medium', min_temp=16, max_temp=32,
                 min_space=20, water_needs='moderate', emoji='🫑',
                 description='Versatile crop for USA, Europe and Mediterranean climates.', days_to_harvest=80),
            Crop(name='Thyme', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=5, max_temp=30,
                 min_space=8, water_needs='low', emoji='🌿',
                 description='Drought-tolerant herb. Popular in Mediterranean and European cooking.', days_to_harvest=60),
            Crop(name='Rosemary', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=5, max_temp=35,
                 min_space=10, water_needs='low', emoji='🌿',
                 description='Mediterranean herb. Thrives in warm sunny spots. Very hardy.', days_to_harvest=90),

            # ── MIDDLE EAST / AFRICA (25-45°C) ──
            Crop(name='Fenugreek', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=22, max_temp=42,
                 min_space=10, water_needs='low', emoji='🌱',
                 description='Drought resistant. Popular in Middle East, India and Africa.', days_to_harvest=30),
            Crop(name='Sweet Potato', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='medium', min_temp=22, max_temp=40,
                 min_space=30, water_needs='low', emoji='🍠',
                 description='Heat-loving crop. Great for Africa, Middle East and tropical Asia.', days_to_harvest=120),
            Crop(name='Moringa', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=25, max_temp=45,
                 min_space=20, water_needs='low', emoji='🌳',
                 description='Superfood tree for hot dry climates. Africa, India, Middle East.', days_to_harvest=180),

            # ── SOUTHEAST ASIA (22-38°C) ──
            Crop(name='Lemongrass', soil_requirements='any', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=22, max_temp=38,
                 min_space=15, water_needs='moderate', emoji='🌾',
                 description='Essential in Thai & Vietnamese cooking. Grows in clumps.', days_to_harvest=90),
            Crop(name='Pandan', soil_requirements='loamy', sunlight_needs='partial',
                 growing_season='all', difficulty_level='easy', min_temp=22, max_temp=38,
                 min_space=20, water_needs='high', emoji='🌿',
                 description='Popular aromatic herb in Southeast Asian cooking.', days_to_harvest=90),
            Crop(name='Kangkong', soil_requirements='any', sunlight_needs='full',
                 growing_season='all', difficulty_level='easy', min_temp=20, max_temp=38,
                 min_space=10, water_needs='high', emoji='🥬',
                 description='Water spinach. Fast growing leafy green in SE Asia.', days_to_harvest=21),

            # ── BEANS / UNIVERSAL ──
            Crop(name='Bush Beans', soil_requirements='sandy', sunlight_needs='full',
                 growing_season='summer', difficulty_level='easy', min_temp=16, max_temp=35,
                 min_space=20, water_needs='moderate', emoji='🫘',
                 description='Compact and productive. Grows in most climates worldwide.', days_to_harvest=55),
        ]
        for c in crops:
            db.session.add(c)
        db.session.commit()

# ─────────────────────────────────────────────
# ROUTES - PAGES
# ─────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/community')
def community():
    return render_template('community.html')

# ─────────────────────────────────────────────
# ROUTES - AUTH API
# ─────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        location=data.get('location', 'Chennai')
    )
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': {'id': user.id, 'name': user.name, 'email': user.email}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        session['user_id'] = user.id
        return jsonify({'success': True, 'user': {'id': user.id, 'name': user.name, 'email': user.email}})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False}), 401
    user = User.query.get(user_id)
    return jsonify({'success': True, 'user': {
        'id': user.id, 'name': user.name, 'email': user.email,
        'location': user.location, 'terrace_size': user.terrace_size,
        'soil_type': user.soil_type, 'sunlight': user.sunlight
    }})

# ─────────────────────────────────────────────
# ROUTES - RECOMMENDATIONS API
# ─────────────────────────────────────────────

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    data = request.get_json()
    soil = data.get('soil', 'loamy')
    sunlight = data.get('sunlight', 'full')
    location = data.get('location', 'Chennai')
    size = data.get('size', 50)

    recommended_crops, weather = ai_recommendation_engine(soil, sunlight, location, size)
    return jsonify({
        'success': True,
        'recommended_crops': recommended_crops,
        'weather': weather
    })

@app.route('/api/crops', methods=['GET'])
def get_all_crops():
    crops = Crop.query.all()
    return jsonify({'success': True, 'crops': [{
        'id': c.id, 'name': c.name, 'emoji': c.emoji,
        'difficulty': c.difficulty_level, 'days_to_harvest': c.days_to_harvest,
        'description': c.description
    } for c in crops]})

# ─────────────────────────────────────────────
# ROUTES - GARDEN MANAGEMENT API
# ─────────────────────────────────────────────

@app.route('/api/garden', methods=['GET'])
def get_garden():
    user_id = session.get('user_id', 1)
    schedules = GardenSchedule.query.filter_by(user_id=user_id).all()
    return jsonify({'success': True, 'schedules': [{
        'id': s.id, 'crop_name': s.crop_name,
        'planted_date': s.planted_date.isoformat(),
        'status': s.status, 'notes': s.notes
    } for s in schedules]})

@app.route('/api/garden', methods=['POST'])
def add_garden_item():
    user_id = session.get('user_id', 1)
    data = request.get_json()
    schedule = GardenSchedule(
        user_id=user_id,
        crop_name=data['crop_name'],
        notes=data.get('notes', '')
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify({'success': True, 'id': schedule.id})

# ─────────────────────────────────────────────
# ROUTES - COMMUNITY API
# ─────────────────────────────────────────────

@app.route('/api/forum', methods=['GET'])
def get_posts():
    posts = ForumPost.query.order_by(ForumPost.created_at.desc()).all()
    return jsonify({'success': True, 'posts': [{
        'id': p.id, 'title': p.title, 'content': p.content,
        'category': p.category,
        'author': User.query.get(p.author_id).name if p.author_id else 'Anonymous',
        'created_at': p.created_at.isoformat(),
        'comment_count': len(p.comments)
    } for p in posts]})

@app.route('/api/forum', methods=['POST'])
def create_post():
    user_id = session.get('user_id', 1)
    data = request.get_json()
    post = ForumPost(
        title=data['title'],
        content=data['content'],
        author_id=user_id,
        category=data.get('category', 'General')
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({'success': True, 'id': post.id})

@app.route('/api/forum/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).all()
    return jsonify({'success': True, 'comments': [{
        'id': c.id, 'content': c.content,
        'author': User.query.get(c.author_id).name if c.author_id else 'Anonymous',
        'created_at': c.created_at.isoformat()
    } for c in comments]})

@app.route('/api/forum/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    user_id = session.get('user_id', 1)
    data = request.get_json()
    comment = Comment(content=data['content'], post_id=post_id, author_id=user_id)
    db.session.add(comment)
    db.session.commit()
    return jsonify({'success': True})

# ─────────────────────────────────────────────
# ROUTES - WEATHER API
# ─────────────────────────────────────────────

@app.route('/api/reset-crops', methods=['POST'])
def reset_crops():
    Crop.query.delete()
    db.session.commit()
    seed_crops()
    return jsonify({'success': True, 'count': Crop.query.count()})

@app.route('/api/weather', methods=['GET'])
def weather():
    location = request.args.get('location', 'Chennai')
    data = get_weather_data(location)
    return jsonify({'success': True, 'weather': data})

# ─────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────

with app.app_context():
    db.create_all()
    seed_crops()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
