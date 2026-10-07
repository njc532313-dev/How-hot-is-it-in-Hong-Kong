import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { extname, join, normalize } from "node:path"

const port = Number(process.env.PORT || 4173)
const root = join(import.meta.dirname, "dist")
const hkhiUrl = "https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/recent10_10min_hkhi.csv"
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" }

createServer(async (request, response) => {
  try {
    if (request.url === "/api/hkhi") {
      const upstream = await fetch(hkhiUrl)
      if (!upstream.ok) throw new Error(`HKO returned ${upstream.status}`)
      response.writeHead(200, { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store" })
      response.end(await upstream.text())
      return
    }

    const urlPath = decodeURIComponent((request.url || "/").split("?")[0])
    let file = normalize(join(root, urlPath === "/" ? "index.html" : urlPath))
    if (!file.startsWith(root)) throw new Error("Invalid path")
    if (!(await stat(file).catch(() => null))?.isFile()) file = join(root, "index.html")
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" })
    response.end(await readFile(file))
  } catch (error) {
    response.writeHead(502, { "content-type": "text/plain; charset=utf-8" })
    response.end(error instanceof Error ? error.message : "Unable to serve request")
  }
}).listen(port, "127.0.0.1", () => console.log(`HKHI Live: http://127.0.0.1:${port}`))
