#!/usr/bin/env node
import { WebSocketServer } from "ws";
import { spawn } from "node:child_process";
import http from "node:http";

const PORT = Number(process.env.RELAY_PORT || 6060);
const HOST = process.env.RELAY_HOST || "0.0.0.0";
const VIDEO_BITRATE = process.env.RELAY_VIDEO_BITRATE || "12000k";
const VIDEO_BUF = process.env.RELAY_VIDEO_BUF || "24000k";
const VIDEO_FPS = process.env.RELAY_VIDEO_FPS || "30";
const AUDIO_BITRATE = process.env.RELAY_AUDIO_BITRATE || "192k";

const server = http.createServer();
const wss = new WebSocketServer({ server });

function createFfmpegProcess(rtmpUrl) {
  const args = [
    "-loglevel",
    "warning",
    "-probesize",
    "10M",
    "-analyzeduration",
    "10M",
    "-fflags",
    "+genpts",
    "-f",
    "webm",
    "-i",
    "pipe:0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "zerolatency",
    "-b:v",
    VIDEO_BITRATE,
    "-maxrate",
    VIDEO_BITRATE,
    "-minrate",
    VIDEO_BITRATE,
    "-bufsize",
    VIDEO_BUF,
    "-r",
    VIDEO_FPS,
    "-x264-params",
    "nal-hrd=cbr:force-cfr=1",
    "-g",
    "60",
    "-keyint_min",
    "60",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    AUDIO_BITRATE,
    "-ac",
    "2",
    "-ar",
    "48000",
    "-af",
    "highpass=f=80,lowpass=f=16000,aresample=async=1",
    "-flvflags",
    "no_duration_filesize",
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
  let bufferedChunks = [];

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "start" && msg.rtmpUrl) {
          rtmpUrl = msg.rtmpUrl;
          console.log(`[relay] start stream -> ${rtmpUrl}`);
          ffmpeg = createFfmpegProcess(rtmpUrl);
          ws.send(JSON.stringify({ type: "ready" }));
          if (bufferedChunks.length) {
            bufferedChunks.forEach((chunk) => ffmpeg.stdin.write(chunk));
            bufferedChunks = [];
          }
        }
        if (msg.type === "stop") {
          console.log("[relay] stop stream");
          if (ffmpeg) ffmpeg.stdin.end();
          ffmpeg = null;
          bufferedChunks = [];
        }
      } catch (err) {
        console.warn("[relay] bad control message", err);
      }
      return;
    }
    if (!ffmpeg) {
      bufferedChunks.push(data);
      return;
    }
    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(data);
    }
  });

  ws.on("close", () => {
    if (ffmpeg) ffmpeg.stdin.end();
    ffmpeg = null;
    bufferedChunks = [];
    console.log("[relay] client disconnected");
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[relay] listening on ws://${HOST}:${PORT}`);
});
