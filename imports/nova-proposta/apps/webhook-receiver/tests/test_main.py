from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from svix.webhooks import WebhookVerificationError

MODULE_PATH = Path(__file__).resolve().parent.parent / "main.py"
MODULE_SPEC = spec_from_file_location("webhook_receiver_main", MODULE_PATH)
assert MODULE_SPEC and MODULE_SPEC.loader
webhook_main = module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(webhook_main)


class DummyRedis:
    def __init__(self):
        self.events = []

    async def xadd(self, stream, payload):
        self.events.append({"payload": payload, "stream": stream})
        return "1-0"


def test_health_reports_service_ok():
    with TestClient(webhook_main.app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_reports_dependency_state_in_strict_runtime(monkeypatch):
    monkeypatch.setattr(webhook_main, "_is_strict_runtime", lambda: True)

    class DummyRedisHealth:
        async def ping(self):
            return True

    class DummyResponse:
        def raise_for_status(self):
            return None

    class DummyClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def get(self, _url):
            return DummyResponse()

    monkeypatch.setattr(webhook_main, "_get_redis_client", lambda: DummyRedisHealth())
    monkeypatch.setattr(webhook_main.httpx, "AsyncClient", lambda timeout=5: DummyClient())
    monkeypatch.setattr(webhook_main, "INTERNAL_SERVICE_TOKEN", "svc_test")
    monkeypatch.setattr(webhook_main, "PRIMARY_API_URL", "http://primary.local")
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", "http://compat.local")
    monkeypatch.setenv("SVIX_WEBHOOK_SECRET", "svix_test")

    with TestClient(webhook_main.app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["services"]["primaryApi"]["status"] == "up"
    assert payload["services"]["compatApi"]["status"] == "up"


def test_stripe_webhook_dispatches_internal_patch_and_records_event(monkeypatch):
    captured_calls = []
    redis = DummyRedis()

    async def fake_patch(path, payload):
        captured_calls.append({"path": path, "payload": payload})

    monkeypatch.setattr(webhook_main, "_verify_svix_signature", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(webhook_main, "_patch", fake_patch)
    monkeypatch.setattr(webhook_main, "redis_client", redis)

    with TestClient(webhook_main.app) as client:
        response = client.post(
            "/webhooks/stripe",
            headers={
                "svix-id": "evt_1",
                "svix-signature": "signature",
                "svix-timestamp": "1700000000",
            },
            json={
                "data": {
                    "object": {
                        "metadata": {
                            "organizationId": "org_123"
                        }
                    }
                },
                "type": "payment_intent.succeeded",
            },
        )

    assert response.status_code == 200
    assert captured_calls == [
        {
            "path": "/api/v1/internal/organizations/org_123/plan",
            "payload": {"plan": "PRO"},
        }
    ]
    assert redis.events[0]["payload"]["type"] == "payment_intent.succeeded"


def test_invalid_svix_signature_returns_401(monkeypatch):
    monkeypatch.setattr(
        webhook_main,
        "_verify_svix_signature",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(HTTPException(status_code=401, detail="Invalid Svix signature")),
    )
    monkeypatch.setattr(webhook_main, "redis_client", DummyRedis())

    with TestClient(webhook_main.app) as client:
        response = client.post(
            "/webhooks/stripe",
            headers={
                "svix-id": "evt_1",
                "svix-signature": "bad",
                "svix-timestamp": "1700000000",
            },
            json={"data": {}, "type": "payment_intent.succeeded"},
        )

    assert response.status_code == 401


def test_runtime_resolvers_cover_fallbacks_and_strict_guards(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("STRICT_RUNTIME", "")
    monkeypatch.setattr(webhook_main, "PRIMARY_API_URL", None)
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", None)

    assert webhook_main._resolve_redis_url() == "redis://localhost:6379"
    assert webhook_main._resolve_api_gateway_url() == "http://localhost:3000"
    assert webhook_main._resolve_primary_api_url() == "http://localhost:3000"

    monkeypatch.setenv("REDIS_URL", "redis://cache.internal:6380")
    monkeypatch.setattr(webhook_main, "PRIMARY_API_URL", "https://primary.example.com")
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", "https://compat.example.com")

    assert webhook_main._resolve_redis_url() == "redis://cache.internal:6380"
    assert webhook_main._resolve_api_gateway_url() == "https://compat.example.com"
    assert webhook_main._resolve_primary_api_url() == "https://primary.example.com"

    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.setattr(webhook_main, "PRIMARY_API_URL", None)
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", None)

    with pytest.raises(RuntimeError, match="REDIS_URL"):
        webhook_main._resolve_redis_url()

    with pytest.raises(RuntimeError, match="API_GATEWAY_URL or PRIMARY_API_URL"):
        webhook_main._resolve_api_gateway_url()

    with pytest.raises(RuntimeError, match="PRIMARY_API_URL or API_URL"):
        webhook_main._resolve_primary_api_url()


def test_verify_svix_signature_covers_missing_secret_headers_and_invalid_signature(monkeypatch):
    monkeypatch.delenv("SVIX_WEBHOOK_SECRET", raising=False)

    with pytest.raises(HTTPException, match="SVIX_WEBHOOK_SECRET is not configured") as missing_secret:
        webhook_main._verify_svix_signature(b"{}", "evt_1", "1700000000", "sig")

    assert missing_secret.value.status_code == 500

    monkeypatch.setenv("SVIX_WEBHOOK_SECRET", "svix_test")

    with pytest.raises(HTTPException, match="Missing Svix signature headers") as missing_headers:
        webhook_main._verify_svix_signature(b"{}", None, "1700000000", "sig")

    assert missing_headers.value.status_code == 401

    observed = {}

    class DummyWebhook:
        def __init__(self, secret):
            observed["secret"] = secret

        def verify(self, body, headers):
            observed["body"] = body
            observed["headers"] = headers

    monkeypatch.setattr(webhook_main, "Webhook", DummyWebhook)
    webhook_main._verify_svix_signature(b"{}", "evt_1", "1700000000", "sig")

    assert observed == {
        "secret": "svix_test",
        "body": b"{}",
        "headers": {
            "svix-id": "evt_1",
            "svix-signature": "sig",
            "svix-timestamp": "1700000000",
        },
    }

    class FailingWebhook:
        def __init__(self, _secret):
            return None

        def verify(self, _body, _headers):
            raise WebhookVerificationError("invalid")

    monkeypatch.setattr(webhook_main, "Webhook", FailingWebhook)

    with pytest.raises(HTTPException, match="Invalid Svix signature") as invalid_signature:
        webhook_main._verify_svix_signature(b"{}", "evt_1", "1700000000", "sig")

    assert invalid_signature.value.status_code == 401


@pytest.mark.asyncio
async def test_patch_and_secondary_handlers_dispatch_internal_requests(monkeypatch):
    captured = []

    class DummyClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def patch(self, url, json, headers):
            captured.append({"url": url, "json": json, "headers": headers})

    monkeypatch.setattr(webhook_main, "INTERNAL_SERVICE_TOKEN", "svc_test")
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", "https://compat.example.com")
    monkeypatch.setattr(webhook_main.httpx, "AsyncClient", lambda timeout=10: DummyClient())

    await webhook_main._patch("/api/v1/internal/test", {"status": "ok"})
    await webhook_main.handle_subscription_change(
        {
            "object": {
                "metadata": {
                    "organizationId": "org_subscription",
                    "plan": "ENTERPRISE",
                }
            }
        }
    )
    await webhook_main.handle_email_open({"activityId": "activity_123"})
    await webhook_main.handle_payment_success({})
    await webhook_main.handle_subscription_change({})
    await webhook_main.handle_email_open({})

    assert captured == [
        {
            "url": "https://compat.example.com/api/v1/internal/test",
            "json": {"status": "ok"},
            "headers": {
                "Content-Type": "application/json",
                "x-service-token": "svc_test",
            },
        },
        {
            "url": "https://compat.example.com/api/v1/internal/organizations/org_subscription/plan",
            "json": {"plan": "ENTERPRISE"},
            "headers": {
                "Content-Type": "application/json",
                "x-service-token": "svc_test",
            },
        },
        {
            "url": "https://compat.example.com/api/v1/internal/activities/activity_123",
            "json": {"status": "OPENED"},
            "headers": {
                "Content-Type": "application/json",
                "x-service-token": "svc_test",
            },
        },
    ]


@pytest.mark.asyncio
async def test_health_reports_degraded_dependencies_and_missing_secrets(monkeypatch):
    monkeypatch.setattr(webhook_main, "_is_strict_runtime", lambda: True)
    monkeypatch.setattr(webhook_main, "INTERNAL_SERVICE_TOKEN", None)
    monkeypatch.setattr(webhook_main, "PRIMARY_API_URL", None)
    monkeypatch.setattr(webhook_main, "API_GATEWAY_URL", None)
    monkeypatch.delenv("SVIX_WEBHOOK_SECRET", raising=False)

    class FailingRedis:
        async def ping(self):
            raise RuntimeError("redis down")

    class FailingClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def get(self, _url):
            raise RuntimeError("api down")

    monkeypatch.setattr(webhook_main, "_get_redis_client", lambda: FailingRedis())
    monkeypatch.setattr(webhook_main.httpx, "AsyncClient", lambda timeout=5: FailingClient())

    payload = await webhook_main.health()

    assert payload["status"] == "degraded"
    assert payload["services"]["redis"]["status"] == "down"
    assert payload["services"]["primaryApi"]["status"] == "down"
    assert payload["services"]["compatApi"]["status"] == "down"
    assert payload["services"]["internalServiceToken"]["status"] == "down"
    assert payload["services"]["svixSecret"]["status"] == "down"


def test_subscription_and_resend_webhooks_record_events(monkeypatch):
    captured_calls = []
    redis = DummyRedis()

    async def fake_subscription_change(data):
        captured_calls.append({"handler": "subscription", "data": data})

    async def fake_email_open(data):
        captured_calls.append({"handler": "email", "data": data})

    monkeypatch.setattr(webhook_main, "_verify_svix_signature", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(webhook_main, "handle_subscription_change", fake_subscription_change)
    monkeypatch.setattr(webhook_main, "handle_email_open", fake_email_open)
    monkeypatch.setattr(webhook_main, "redis_client", redis)

    with TestClient(webhook_main.app) as client:
        subscription_response = client.post(
            "/webhooks/stripe",
            headers={
                "svix-id": "evt_2",
                "svix-signature": "signature",
                "svix-timestamp": "1700000001",
            },
            json={
                "data": {"object": {"metadata": {"organizationId": "org_456", "plan": "PRO"}}},
                "type": "customer.subscription.updated",
            },
        )
        resend_response = client.post(
            "/webhooks/resend",
            headers={
                "svix-id": "evt_3",
                "svix-signature": "signature",
                "svix-timestamp": "1700000002",
            },
            json={
                "data": {"activityId": "activity_456"},
                "type": "email.opened",
            },
        )

    assert subscription_response.status_code == 200
    assert resend_response.status_code == 200
    assert captured_calls == [
        {
            "handler": "subscription",
            "data": {"object": {"metadata": {"organizationId": "org_456", "plan": "PRO"}}},
        },
        {
            "handler": "email",
            "data": {"activityId": "activity_456"},
        },
    ]
    assert [event["payload"]["type"] for event in redis.events] == [
        "customer.subscription.updated",
        "email.opened",
    ]
