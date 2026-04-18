from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import string
import secrets

db = SQLAlchemy()

def generate_unique_id(prefix="ast", length=10):
    alphabet = string.ascii_letters + string.digits
    return prefix + "_" + "".join(secrets.choice(alphabet) for _ in range(length))

class User(db.Model):
    id = db.Column(db.String(20), primary_key=True, default=lambda: generate_unique_id("usr"))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return{
            'id':self.id,
            'email':self.email,
            'name':self.name,
            'joined':self.created_at
        }

class Widget(db.Model):
    id = db.Column(db.String(20), primary_key=True, default=lambda: generate_unique_id('wid', 20))
    name = db.Column(db.String(100), nullable=False)
    owner_id = db.Column(db.String(20), db.ForeignKey('user.id'), nullable=False)
    domain = db.Column(db.String(255))
    color = db.Column(db.String(7), default="#6366f1")
    is_active = db.Column(db.Boolean, default=True)
    auto_reply = db.Column(db.Boolean, default=False)

class SupportRequest(db.Model):
    id = db.Column(db.String(20), primary_key=True, default=lambda: generate_unique_id("req"))
    widget_id = db.Column(db.String(20), db.ForeignKey('widget.id'), nullable=False)
    customer_email = db.Column(db.String(120))
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="Pending")
    browser = db.Column(db.String(50))
    device = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to messages
    replies = db.relationship('RequestMessage', backref='request', lazy=True, cascade="all, delete-orphan")

class RequestMessage(db.Model):
    id = db.Column(db.String(20), primary_key=True, default=lambda: generate_unique_id("msg"))
    request_id = db.Column(db.String(20), db.ForeignKey('support_request.id'), nullable=False)
    sender_type = db.Column(db.String(10)) # 'customer' or 'agent'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)