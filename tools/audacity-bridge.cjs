#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.AUDACITY_BRIDGE_PORT || 7337);
const HOST = process.env.AUDACITY_BRIDGE_HOST || "127.0.0.1";
const PIPE_DIR = process.env.AUDACITY_PIPE_DIR || "/tmp";
const PIPE_TO = process.env.AUDACITY_PIPE_TO || "";
const PIPE_FROM = process.env.AUDACITY_PIPE_FROM || "";

function candidatePipeDirs() {
  const dirs = [PIPE_DIR, "/private/tmp", "/System/Volumes/Data/private/tmp"];
  return Array.from(new Set(dirs.filter(Boolean)));
}

function buildPipePaths(dir) {
  const uid = typeof process.getuid === "function" ? process.getuid() : null;
  const suffix = uid != null ? `.${uid}` : "";
  return {
    to: path.join(dir, `audacity_script_pipe.to${suffix}`),
    from: path.join(dir, `audacity_script_pipe.from${suffix}`),
  };
}

function getPipePaths() {
  if (PIPE_TO && PIPE_FROM) {
    return { to: PIPE_TO, from: PIPE_FROM };
  }
  for (const dir of candidatePipeDirs()) {
    const paths = buildPipePaths(dir);
    if (fs.existsSync(paths.to) && fs.existsSync(paths.from)) {
      return paths;
    }
  }
  return buildPipePaths(PIPE_DIR);
}

function sendCommand(command) {
  const { to } = getPipePaths();
  const writeDirect = (pipePath) => {
    const fd = fs.openSync(pipePath, "w");
    try {
      fs.writeSync(fd, `${command}\n`);
    } finally {
      fs.closeSync(fd);
    }
  };

  return fs.promises.access(to, fs.constants.W_OK).then(
    () => writeDirect(to),
    async () => {
      const candidates = candidatePipeDirs().map((dir) => buildPipePaths(dir));
      const found = candidates.find(
        (paths) => fs.existsSync(paths.to) && fs.existsSync(paths.from),
      );
      if (found && found.to !== to) {
        writeDirect(found.to);
        return;
      }
      throw new Error(
        `Audacity pipe not found. Checked: ${candidates
          .map((p) => p.to)
          .join(", ")}`,
      );
    },
  );
}

function mapActionToCommand(action) {
  switch (action) {
    case "start":
      return "Record1stChoice";
    case "stop":
      return "Stop";
    case "pause":
    case "resume":
    case "toggle":
      return "Pause";
    default:
      return null;
  }
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    const { to, from } = getPipePaths();
    writeJson(res, 200, {
      ok: true,
      to,
      from,
      toExists: fs.existsSync(to),
      fromExists: fs.existsSync(from),
    });
    return;
  }

  if (req.method === "POST" && req.url === "/command") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const command =
          payload.command || mapActionToCommand(payload.action || "");
        if (!command) {
          writeJson(res, 400, {
            ok: false,
            error: "Unknown action or command",
          });
          return;
        }
        await sendCommand(command);
        writeJson(res, 200, { ok: true, command });
      } catch (err) {
        writeJson(res, 500, { ok: false, error: String(err) });
      }
    });
    return;
  }

  writeJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`Audacity bridge listening on http://${HOST}:${PORT}`);
});
