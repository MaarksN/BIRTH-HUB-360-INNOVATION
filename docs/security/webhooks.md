# Webhook Security

This document outlines the security measures in place for handling incoming webhooks, particularly for billing (Stripe).

## Signature Validation

Webhooks are verified using cryptographic signatures to ensure they originate from the expected provider. The signature is checked against a set of valid webhook secrets configured in the environment. The `constructStripeEventWithCandidates` function iterates through `stripeWebhookSecretCandidates` to support key rotation without dropping valid events during the transition period.

## Replay Protection

To prevent replay attacks, the webhook payload's signature timestamp is validated against the current time. If the timestamp is older than the configured `STRIPE_WEBHOOK_TOLERANCE_SECONDS` (typically 5 minutes), the event is rejected as a potential replay attack (`ensureWebhookWithinReplayWindow`).

## Idempotency and Deduplication

Idempotency is maintained to ensure that duplicate webhook deliveries do not result in duplicate processing:
- **Database Tracking:** Each processed event is recorded in the `billingEvent` table. If an event is received with an ID that has already been marked as `processed`, it is ignored.
- **Caching:** A fast cache-based deduplication layer (`stripeWebhookIdempotencyKey`) checks if an event was recently processed before falling back to the database.
- **Distributed Locking:** Concurrent deliveries of the same event are synchronized using distributed locks (`withStripeEventLock`), ensuring that only one worker processes the event at a time.

## Key Rotation

Key rotation is supported natively. The system can be configured with a primary webhook secret and multiple fallback secrets (`STRIPE_WEBHOOK_SECRET_FALLBACKS`). During a rotation, the new key becomes the primary, and the old key is placed in the fallbacks. The system will attempt to verify signatures against all candidate keys. Once the provider is confirmed to be using the new key exclusively, the fallback can be safely removed.

## Payload Validation

Before the payload enters the business logic layer, the event signature must be validated (`constructStripeEvent`). The structure of the event is guaranteed by the Stripe SDK's construction process, effectively acting as strict schema validation. Unrecognized or malformed payloads will fail signature validation or event construction.
