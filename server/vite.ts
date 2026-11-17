import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { sendSeoPage } from "./seo";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      // Page-specific title, description, structured data and readable content
      await sendSeoPage(req, res, page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // index: false so "/" also goes through the SEO page writer below
  app.use(express.static(distPath, { index: false }));

  const template = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");

  // Every page URL gets index.html with its own title, description,
  // structured data and readable content (see server/seo.ts).
  app.use("*", (req, res) => {
    // Unknown API address: a JSON error, not a web page
    if (req.originalUrl.startsWith("/api/")) {
      res.status(404).json({ message: `No such API route: ${req.method} ${req.originalUrl.split("?")[0]}` });
      return;
    }
    // A missing file (old /assets/*.js, images) is a plain 404, not a web page
    if (/\.[a-z0-9]{2,5}$/i.test(req.originalUrl.split("?")[0] ?? "") && !req.originalUrl.endsWith(".html")) {
      res.status(404).type("text/plain").end("Not found");
      return;
    }
    void sendSeoPage(req, res, template);
  });
}
