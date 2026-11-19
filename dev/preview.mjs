// Serves src/ as plain web pages for design work: a stand-in for the extension API, and a live reload on save
// (style sheets swap in place, anything else reloads the page). Run: npm run preview
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src");
const port = Number(process.env.PORT) || 5179;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
const clients = new Set();

// Saves go to every open preview: CSS is swapped without a reload, so the page keeps its state.
watch(src, { recursive: true }, (_, file) => {
  if (!file) return;
  const kind = extname(file) === ".css" ? "css" : "reload";
  for (const res of clients) res.write(`data: ${kind}\n\n`);
});

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") return res.writeHead(302, { location: "/fonts.html" }).end();
  if (path === "/__dev/events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (path === "/__dev/mock.js") {
    res.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" });
    return res.end(await readFile(join(here, "mock.js")));
  }
  const file = normalize(join(src, path));
  if (!file.startsWith(src)) return res.writeHead(403).end();
  try {
    let body = await readFile(file);
    if (extname(file) === ".html") body = body.toString().replace("<head>", '<head>\n  <script src="/__dev/mock.js"></script>');
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, "127.0.0.1", () => console.log(`Preview on http://localhost:${port}/`));
