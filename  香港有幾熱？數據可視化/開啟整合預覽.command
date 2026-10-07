#!/bin/zsh
set -e
cd -- "${0:A:h}"

if ! command -v node >/dev/null 2>&1; then
  codex_runtime="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  if [[ -x "${codex_runtime}/node/bin/node" ]]; then
    export PATH="${codex_runtime}/node/bin:${PATH}"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "找不到 Node.js。請先安裝 Node.js 20 或以上版本。"
  read -r "?按 Enter 關閉…"
  exit 1
fi

node --input-type=module - <<'NODE'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'

const page = '香港有幾熱_整合預覽.html'
const source = 'https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/recent10_10min_hkhi.csv'
const weather = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'

createServer(async (request, response) => {
  try {
    if (request.url === '/api/hkhi') {
      const upstream = await fetch(source, { cache: 'no-store' })
      if (!upstream.ok) throw new Error(`天文台回應 ${upstream.status}`)
      response.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store' })
      response.end(await upstream.text())
    } else if (request.url === '/api/current-weather') {
      const upstream = await fetch(weather, { cache: 'no-store' })
      if (!upstream.ok) throw new Error(`天文台回應 ${upstream.status}`)
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      response.end(await upstream.text())
    } else if (request.url === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end(await readFile(page))
    } else {
      response.writeHead(404).end()
    }
  } catch (error) {
    response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    response.end(error instanceof Error ? error.message : '資料暫時無法載入')
  }
}).listen(0, '127.0.0.1', function () {
  const url = `http://127.0.0.1:${this.address().port}/`
  console.log(`整合預覽：${url}`)
  console.log('保持此視窗開啟；按 Control-C 停止預覽。')
  if (!process.env.NO_OPEN) execFile('open', [url])
})
NODE
