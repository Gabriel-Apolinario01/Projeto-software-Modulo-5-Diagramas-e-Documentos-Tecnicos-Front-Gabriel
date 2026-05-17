const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 8080;
const rootDir = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((request, response) => {
  const requestedPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const filePath = resolveFilePath(requestedPath);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Erro ao carregar arquivo.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(content);
  });
});

server.listen(port, () => {
  console.log(`DocuIA frontend online na porta ${port}`);
});

function resolveFilePath(requestedPath) {
  if (requestedPath.startsWith("/.") || requestedPath.includes("/.")) {
    return null;
  }

  const normalizedPath = path.normalize(decodeURIComponent(requestedPath));
  const relativePath = normalizedPath === path.sep ? "index.html" : normalizedPath.replace(/^[/\\]+/, "");
  const candidatePath = path.resolve(rootDir, relativePath);

  if (!candidatePath.startsWith(rootDir)) {
    return null;
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  return path.join(rootDir, "index.html");
}
