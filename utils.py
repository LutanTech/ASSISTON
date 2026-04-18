import base64
import hmac
import hashlib
import time
from werkzeug.security import generate_password_hash, check_password_hash

SECRET_KEY = b"f27224b6-cb1d-4f20-bd06-ba3a94186184"

def detect_device(ua):
    ua = ua.lower()
    if "mobile" in ua:
        return "Mobile"
    elif "tablet" in ua:
        return "Tablet"
    return "Desktop"

def detect_browser(ua):
    ua = ua.lower()
    if "chrome" in ua and "edg" not in ua:
        return "Chrome"
    elif "firefox" in ua:
        return "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        return "Safari"
    elif "edg" in ua:
        return "Edge"
    return "Unknown"

# AUTH TOKEN (session)
def generate_auth_token(user_id):
    payload = f"{user_id}:{int(time.time())}".encode()
    payload_b64 = base64.urlsafe_b64encode(payload).decode()

    sig = hmac.new(SECRET_KEY, payload_b64.encode(), hashlib.sha256).hexdigest()

    return f"{payload_b64}::{sig}"

def verify_auth_token(token):
    try:
        payload_b64, sig = token.split("::")

        expected = hmac.new(
            SECRET_KEY,
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(sig, expected):
            return None

        payload = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        user_id, ts = payload.split(":")

        if time.time() - int(ts) > 72 * 3600:
            return None

        return user_id

    except Exception:
        return None