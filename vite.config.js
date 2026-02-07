import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { spawn } from "child_process";
import http from "http";

function checkBridgeHealth(bridgeUrl) {
  return new Promise((resolve) => {
    try {
      const healthUrl = new URL("/health", bridgeUrl);
      const req = http.request(
        {
          hostname: healthUrl.hostname,
          port: healthUrl.port,
          path: healthUrl.pathname,
          method: "GET",
          timeout: 1000,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 300);
        },
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

function audacityBridgeLauncherPlugin() {
  return {
    name: "audacity-bridge-launcher",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = (req.url || "").split("?")[0];
        if (requestPath !== "/__audacity/connect" || req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          let payload = {};
          try {
            payload = body ? JSON.parse(body) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "invalid-json" }));
            return;
          }
          const bridgeUrl =
            payload.bridgeUrl ||
            process.env.VITE_AUDACITY_BRIDGE_URL ||
            "http://127.0.0.1:7337";

          if (await checkBridgeHealth(bridgeUrl)) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, status: "already-running" }));
            return;
          }

          const child = spawn(
            process.execPath,
            [path.resolve(__dirname, "tools/audacity-bridge.cjs")],
            {
              cwd: __dirname,
              detached: true,
              stdio: "ignore",
              env: process.env,
            },
          );
          child.unref();

          let connected = false;
          for (let i = 0; i < 10; i += 1) {
            // Give the bridge a brief window to bind its port.
            await new Promise((resolve) => setTimeout(resolve, 250));
            if (await checkBridgeHealth(bridgeUrl)) {
              connected = true;
              break;
            }
          }

          res.setHeader("Content-Type", "application/json");
          if (connected) {
            res.end(JSON.stringify({ ok: true, status: "started" }));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: "bridge-start-failed" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), audacityBridgeLauncherPlugin()],
  assetsInclude: ["**/*.svg"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (id.includes("jspdf")) return "jspdf";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("bootstrap-icons")) return "icons";
          if (id.includes("idb")) return "idb";
          return "vendor";
        },
      },
    },
  },
});
