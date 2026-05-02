import hmac
import hashlib

from orchestrator.webhook_verifier import verify_webhook


def test_verify_webhook_accepts_valid_hmac():
    secret = "whsec_abc"
    body = b'{"event":"x"}'
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    assert verify_webhook(secret, body, sig)


def test_verify_webhook_rejects_tampered_body():
    secret = "whsec_abc"
    body = b'{"event":"x"}'
    sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    assert not verify_webhook(secret, b'{"event":"y"}', sig)


def test_verify_webhook_rejects_garbage():
    assert not verify_webhook("whsec", b"x", "not-hex")


def test_verify_webhook_accepts_bearer_token():
    secret = "whsec_abc"
    assert verify_webhook(secret, b'{"event":"x"}', f"Bearer {secret}")


def test_verify_webhook_rejects_wrong_bearer_token():
    assert not verify_webhook("whsec_abc", b'{"event":"x"}', "Bearer whsec_other")


def test_verify_webhook_rejects_empty_header():
    assert not verify_webhook("whsec_abc", b'{"event":"x"}', "")
