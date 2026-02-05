# Live Relay (WebSocket → FFmpeg → RTMP)

This relay accepts WebSocket binary chunks (WebM) and forwards them to FFmpeg,
which pushes the stream to a YouTube RTMP endpoint.

## Requirements
- Node 18+
- FFmpeg installed and on PATH

## Install
```bash
cd tools/live-relay
npm install
```

## Run
```bash
node server.js
```

Optional env:
- `RELAY_PORT` (default 6060)
- `RELAY_HOST` (default 0.0.0.0)

## Notes
- The app sends WebM chunks over WebSocket.
- FFmpeg is configured to copy video and transcode audio to AAC.
