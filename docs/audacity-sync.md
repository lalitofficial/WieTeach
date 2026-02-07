# Audacity Sync (mod-script-pipe)

This app can mirror **Start / Pause / Stop** recording actions to Audacity
using the `mod-script-pipe` feature.

## 1) Enable mod-script-pipe in Audacity
1. Open **Audacity > Preferences**.
2. Go to **Modules**.
3. Find **mod-script-pipe** and set it to **Enabled**.
4. Restart Audacity.

When enabled, Audacity creates two pipes (macOS):
- `/tmp/audacity_script_pipe.to.<uid>` (symlinked to `/private/tmp/...`)
- `/tmp/audacity_script_pipe.from.<uid>`

On macOS, `<uid>` is your user id (e.g. `501`).

## 2) Run the local bridge
From the repo root:

```bash
node tools/audacity-bridge.cjs
```

Optional overrides:
- `AUDACITY_BRIDGE_PORT` (default `7337`)
- `AUDACITY_BRIDGE_HOST` (default `127.0.0.1`)
- `AUDACITY_PIPE_DIR` (default `/tmp`, macOS real path `/private/tmp`)
- `AUDACITY_PIPE_TO` / `AUDACITY_PIPE_FROM` (full paths if Audacity uses custom paths)

## 3) Tell the app where the bridge is
Set the env var for Vite:

```bash
VITE_AUDACITY_BRIDGE_URL=http://127.0.0.1:7337
```

Then start the app as usual.  
Now **Start / Pause / Stop** in the app will also control Audacity.

Note: the bridge uses `Record1stChoice` (Audacity’s scripting ID for Record) and
automatically appends the trailing `:` required by the script pipe for actions.
If you pass a raw `command`, it is sent as-is.
The bridge keeps the response pipe open so you don’t need to run `cat` manually.

You can also send a raw command for testing:

```bash
curl -X POST http://127.0.0.1:7337/command \
  -H "Content-Type: application/json" \
  -d '{"command":"Record1stChoice"}'
```
