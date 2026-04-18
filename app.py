from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, Widget, SupportRequest, RequestMessage
from utils import detect_device, detect_browser, generate_auth_token

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///assiston.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()

# REGISTER
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password:
        return jsonify({"error": "missing fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "user exists"}), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user created"}), 201

# LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    token = generate_auth_token(user.id)

    return jsonify({
        "message": "login success",
        "token": token,
        "user": user.to_dict()
    })

# SUPPORT (PUBLIC)
@app.route('/support', methods=['POST'])
def support():
    data = request.get_json()

    message = data.get('msg')
    wid = data.get('wid')
    email = data.get('email')

    if not message or not wid:
        return jsonify({'error': 'invalid input'}), 400

    widget = Widget.query.get(wid)
    if not widget:
        return jsonify({'error': 'widget not found'}), 404

    ua = request.headers.get('User-Agent', 'Unknown')
    device = detect_device(ua)
    browser = detect_browser(ua)

    req = SupportRequest(
        widget_id=wid,
        customer_email=email,
        message=message,
        # user_agent=ua,
        device=device,
        browser=browser
    )

    db.session.add(req)
    db.session.commit()

    return jsonify({"message": "sent"}), 200

# WIDGETS
@app.route('/api/widgets', methods=['GET'])
def get_widgets():
    user_id = request.args.get('user_id')

    widgets = Widget.query.filter_by(owner_id=user_id).all()

    return jsonify([{
        "id": w.id,
        "name": w.name,
        "domain": w.domain,
        "color": w.color,
        "status": "Active" if w.is_active else "Inactive",
        "autoReply": w.auto_reply
    } for w in widgets])

@app.route('/api/widgets', methods=['POST'])
def create_widget():
    data = request.json

    widget = Widget(
        name=data.get('name'),
        owner_id=data.get('owner_id'),
        domain=data.get('domain'),
        color=data.get('color', '#6366f1'),
        auto_reply=data.get('autoReply', False)
    )

    db.session.add(widget)
    db.session.commit()

    return jsonify({
        "message": "created",
        "id": widget.id
    }), 201

# REQUESTS
@app.route('/api/requests/<widget_id>', methods=['GET'])
def get_requests(widget_id):
    reqs = SupportRequest.query.filter_by(widget_id=widget_id).all()

    return jsonify([{
        "id": r.id,
        "email": r.customer_email,
        "message": r.message,
        "device": r.device,
        "browser": r.browser,
        "status": r.status,
        "date": r.created_at.strftime("%b %d, %Y %H:%M")
    } for r in reqs])

@app.route('/api/requests/<request_id>/status', methods=['PATCH'])
def update_status(request_id):
    data = request.json
    req = SupportRequest.query.get_or_404(request_id)

    req.status = data.get('status')
    db.session.commit()

    return jsonify({"message": "updated"})


@app.route('/api/requests/<request_id>/messages', methods=['GET'])
def get_messages(request_id):
    messages = RequestMessage.query.filter_by(request_id=request_id).order_by(RequestMessage.created_at.asc()).all()
    return jsonify([{
        "id": m.id,
        "sender": m.sender_type,
        "content": m.content,
        "date": m.created_at.strftime("%H:%M")
    } for m in messages])

@app.route('/api/requests/<request_id>/reply', methods=['POST'])
def post_reply(request_id):
    data = request.json
    content = data.get('content')
    
    if not content:
        return jsonify({"error": "Content required"}), 400
        
    msg = RequestMessage(
        request_id=request_id,
        sender_type='agent',
        content=content
    )
    
    # Also update status to Resolved if it was pending
    req = SupportRequest.query.get(request_id)
    if req and req.status == "Pending":
        req.status = "Resolved"
        
    db.session.add(msg)
    db.session.commit()
    
    return jsonify({"message": "Reply sent"}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')