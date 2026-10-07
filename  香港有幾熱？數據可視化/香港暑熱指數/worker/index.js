const staticAssets = __STATIC_ASSETS__

const hkhiUrl = "https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/recent10_10min_hkhi.csv"

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
}

function decodeBase64(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function contentType(pathname) {
  const dot = pathname.lastIndexOf(".")
  return contentTypes[dot >= 0 ? pathname.slice(dot) : ""] || "application/octet-stream"
}

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/api/hkhi") {
      try {
        const upstream = await fetch(hkhiUrl, { headers: { accept: "text/csv" } })
        if (!upstream.ok) throw new Error(`HKO returned ${upstream.status}`)
        return new Response(upstream.body, {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "cache-control": "no-store",
          },
        })
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "Unable to fetch HKHI data", {
          status: 502,
          headers: { "content-type": "text/plain; charset=utf-8" },
        })
      }
    }

    const assetPath = staticAssets[url.pathname] ? url.pathname : "/index.html"
    const asset = staticAssets[assetPath]
    if (!asset) return new Response("Not found", { status: 404 })

    return new Response(decodeBase64(asset), {
      headers: {
        "content-type": contentType(assetPath),
        "cache-control": assetPath === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable",
      },
    })
  },
}
