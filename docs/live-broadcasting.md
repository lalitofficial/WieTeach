# Live Broadcasting (YouTube) — TODO

Goal: Broadcast the full live class (board + webcam + mic) to YouTube Live.

## Requirements
- Use YouTube Live RTMP endpoint + stream key (user-provided).
- Stream composite: background + ink + overlays + webcam + audio.
- Start/stop stream from the app UI with clear status.
- Show errors (permission denied, stream failed, key invalid).

## Approach (MVP)
- Produce a `MediaStream` that matches the recording composite.
- Feed stream to a lightweight RTMP pipeline.
  - Option A (browser-only): Use WebCodecs + WebRTC to a relay server that pushes RTMP.
  - Option B (local bridge): Use a small local Node service to accept WebRTC and push RTMP via FFmpeg.
- Keep recording functionality intact and optionally allow “record + broadcast.”

## TODO
1. UI
   - Add “Go Live” button + status pill (Connecting / Live / Error).
   - Add settings panel for RTMP URL + stream key (masked).
2. Media pipeline
   - Expose a clean `getBroadcastStream()` that returns the composite `MediaStream`.
   - Keep audio track from mic and merge with composite video.
3. Relay
   - Decide between in-browser relay vs local relay service.
   - If local relay: add `tools/relay/` with WebRTC ingest + FFmpeg push.
4. Auth / Secrets
   - Store stream key securely (local-only) and allow reset.
5. Error handling
   - Surface permission errors, unsupported codecs, and connection failures.
6. QA
   - Test with YouTube Live “Test Stream” mode.
   - Validate A/V sync, latency, and recovery after disconnect.

## Notes
- YouTube Live accepts RTMP ingest; browser cannot push RTMP directly.
- A relay (local or hosted) is required for production.
