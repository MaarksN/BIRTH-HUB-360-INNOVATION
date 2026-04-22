# Cycle 2 - Voice Engine Hardening

## Overview
Deep hardening executed for `apps/voice-engine` focusing on removing unsafe Typescript directives and fundamentally improving runtime types and observability.

## Modifications
- Removed `// @ts-nocheck` from `apps/voice-engine/src/server.ts` and `apps/voice-engine/src/server.test.ts`.
- Introduced proper `WebSocketFrame` discriminated unions (`TranscriptChunkFrame`, `TtsFrame`).
- Extracted and strongly typed `CallSession` state to ensure we correctly track active voice sessions without resorting to `any`.
- Added guarded boundaries replacing `ws` unauthenticated connections with direct `authorization` header validations against Twilio secrets.
- Replaced `console.*` with `@birthub/logger` implementations and proper traceability.
- Ensured tests adapted to strict WebSocket HTTP header boundaries.

## Status
- Typecheck: PASS
- Lint: PASS
- Build: PASS
- Test: PASS

## Remaining Risks
1. Still somewhat reliant on casting logic in `decodeSocketPayload`.

