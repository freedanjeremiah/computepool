import hmac
import hashlib


def verify_webhook(secret: str, body_bytes: bytes, signature_header: str) -> bool:
    """KeeperHub webhooks: hex-encoded HMAC-SHA256 over the raw body.

    If the actual KH scheme differs (e.g. timestamp prefix), update only this
    function. The orchestrator never reads the algorithm anywhere else.
    """
    try:
        expected = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
    except Exception:
        return False
    sig = signature_header.lower().removeprefix("sha256=")
    return hmac.compare_digest(expected, sig)
