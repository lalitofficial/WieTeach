#!/usr/bin/env node
import { WebSocketServer } from "ws";
import { spawn } from "node:child_process";
import http from "node:http";

const PORT = Number(process.env.RELAY_PORT || 6060);
const HOST = process.env.RELAY_HOST || "0.0.0.0";

const server = http.createServer();
const wss = new WebSocketServer({ server });

function createFfmpegProcess(rtmpUrl) {
  const args = [
    "-loglevel",
    "warning",
    "-fflags",
    "+genpts",
    "-i",
    "pipe:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-f",
    "flv",
    rtmpUrl,
  ];
  const ffmpeg = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  ffmpeg.on("exit", (code) => {
    console.log(`[relay] ffmpeg exited with code ${code}`);
  });
  return ffmpeg;
}

wss.on("connection", (ws) => {
  let ffmpeg = null;
  let rtmpUrl = null;

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "start" && msg.rtmpUrl) {
          rtmpUrl = msg.rtmpUrl;
          console.log(`[relay] start stream -> ${rtmpUrl}`);
          ffmpeg = createFfmpegProcess(rtmpUrl);
        }
        if (msg.type === "stop") {
          console.log("[relay] stop stream");
          if (ffmpeg) ffmpeg.stdin.end();
          ffmpeg = null;
        }
      } catch (err) {
        console.warn("[relay] bad control message", err);
      }
      return;
    }
    if (!ffmpeg) return;
    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(data);
    }
  });

  ws.on("close", () => {
    if (ffmpeg) ffmpeg.stdin.end();
    ffmpeg = null;
    console.log("[relay] client disconnected");
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[relay] listening on ws://${HOST}:${PORT}`);
});
