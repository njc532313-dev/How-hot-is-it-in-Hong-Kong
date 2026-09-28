#!/bin/zsh

set -e
cd -- "${0:A:h}"

if ! command -v node >/dev/null 2>&1; then
  codex_runtime="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  if [[ -x "${codex_runtime}/node/bin/node" ]]; then
    export PATH="${codex_runtime}/node/bin:${codex_runtime}/bin/fallback:${PATH}"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "找不到 Node.js。請先安裝 Node.js 20 或以上版本，再重新雙擊此檔案。"
  read -r "?按 Enter 關閉…"
  exit 1
fi

if [[ ! -f dist/index.html ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    typeset -a package_runner=(pnpm)
  elif command -v corepack >/dev/null 2>&1; then
    typeset -a package_runner=(corepack pnpm)
  elif command -v npm >/dev/null 2>&1; then
    typeset -a package_runner=(npm)
  else
    echo "找不到可用的套件管理工具。請安裝 pnpm 或 npm。"
    read -r "?按 Enter 關閉…"
    exit 1
  fi

  echo "首次使用，正在安裝網站所需套件…"
  if [[ "${package_runner[1]}" == "npm" ]]; then
    npm install
  else
    "${package_runner[@]}" install --frozen-lockfile
  fi

  echo "正在建立預覽…"
  if [[ "${package_runner[1]}" == "npm" ]]; then
    npm run build
  else
    "${package_runner[@]}" build
  fi
fi

echo "正在開啟預覽…"
preview_port=4174
while nc -z 127.0.0.1 "$preview_port" >/dev/null 2>&1; do
  (( preview_port += 1 ))
done

export PORT="$preview_port"
node server.mjs &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT INT TERM

for attempt in {1..40}; do
  if curl -fsS "http://127.0.0.1:${preview_port}/" >/dev/null 2>&1; then
    open "http://127.0.0.1:${preview_port}/" || echo "瀏覽器未能自動開啟，請手動輸入下列網址。"
    echo "預覽網址：http://127.0.0.1:${preview_port}/"
    echo "保持此視窗開啟；按 Control-C 停止預覽。"
    wait "$server_pid"
    exit 0
  fi
  sleep .25
done

echo "預覽服務未能啟動。"
wait "$server_pid"
