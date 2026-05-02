import hmac
import hashlib


def verify_webhook(secret: str, body_bytes: bytes, signature_header: str) -> bool:
    """Accept the orchestrator's webhook secret either as a bearer token in the
    Authorization header or as a hex-encoded HMAC-SHA256 over the body in
    X-Keeperhub-Signature.

    KeeperHub's HTTP Request action does not auto-sign callbacks, so we have
    each workflow pass the secret directly via Authorization: Bearer <secret>.
    HMAC support is retained for future workflows that may sign instead.
    """
    if not signature_header:
        return False
    auth = signature_header.strip()
    bearer = auth[7:].strip() if auth.lower().startswith("bearer ") else None
    if bearer is not None:
        return hmac.compare_digest(secret, bearer)
    try:
        expected = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
    except Exception:
        return False
    sig = auth.lower().removeprefix("sha256=")
    return hmac.compare_digest(expected, sig)
