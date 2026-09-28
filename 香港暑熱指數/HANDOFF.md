# 香港暑熱指數網站交付流程

## 交付內容

這是一個 React／Vite 網站，主畫面以本地香港官方數碼底圖、瀏覽器 SVG 浮雕濾鏡和十個互動觀測站呈現香港天文台 HKHI。正式環境由 `server.mjs` 同時提供靜態網站與 `/api/hkhi` 代理，因此必須以 HTTP 服務啟動，不能直接雙擊 `index.html`。

重要檔案：

- `src/App.tsx`：資料抓取、10 分鐘更新、摘要及互動狀態。
- `src/components/HongKongStationMap.tsx`：香港地圖、投影、站點按鈕及圖例。
- `src/assets/hong-kong-official-basemap.png`：由香港地政總署數碼地圖服務輸出的本地底圖。
- `src/lib/hkhi.ts`：CSV parser、站名與經緯度。
- `src/styles.css`：桌面、平板及手機版面。
- `DESIGN.md`：完整視覺及互動規格。
- `server.mjs`：正式靜態服務及同源 API 代理。

## 本機預覽

已安裝 Node.js 20 或以上版本即可直接雙擊 `預覽網站.command`。交付資料夾內已有建置完成的 `dist/`，預覽不需要 `node_modules` 或重新安裝套件；只有在 `dist/` 不存在時，啟動器才會安裝套件並建置。修改原始碼後須按下方指令重新建置，預覽才會顯示修改。亦可在終端執行：

```bash
cd "$HOME/Desktop/香港到底有多熱/香港暑熱指數"
./預覽網站.command
```

預設啟動後瀏覽：

```text
http://127.0.0.1:4174/
```

如 4174 埠已被其他服務使用，啟動器會順延使用 4175、4176等可用埠號，並在終端顯示實際網址。

如需手動啟動：

```bash
pnpm install --frozen-lockfile
pnpm build
PORT=4174 pnpm start
```

## 正式部署

部署平台需支援 Node.js，並以以下流程建置與啟動：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

可透過 `PORT` 環境變數指定埠號。`server.mjs` 會：

1. 從 `dist/` 提供已建置網站。
2. 在 `/api/hkhi` 代理香港天文台 CSV。
3. 為 API 回應加入 `cache-control: no-store`。

如果網站搭建者使用自己的後端，仍須保留同源 `/api/hkhi` 路徑，轉發：

```text
https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/recent10_10min_hkhi.csv
```

不要把前端更新頻率改成每分鐘；現有程式首次載入後每 10 分鐘重新請求一次，只顯示整十分鐘的官方 10 分鐘平均讀數。

## 驗收

```bash
pnpm test
pnpm build
PORT=4175 pnpm start
curl -fsS http://127.0.0.1:4175/api/hkhi
```

瀏覽器需確認：

- 預設顯示全港最高站。
- 十個站點都可點擊；hover／focus 更新面板，點擊鎖定，Escape 解鎖。
- 1440×900、1120×800、768×900、390×844 均無水平捲動。
- 頁面沒有各區排行榜或膠囊列表。
- 頁尾保留天文台數據、觀測站位置及香港地政總署地圖來源。

## 已知限制

香港天文台目前公開頁面能確認九龍灣 HKHI 站點代號為 ZCP，但未公開精確座標。地圖暫以 CIC-Zero Carbon Park 附近 `22.3266, 114.2078` 顯示；程式常數與介面均有註明，日後如天文台公布正式座標應更新 `src/lib/hkhi.ts`。

## 來源

- 數據：香港天文台。
- 觀測站位置：香港天文台氣象站資料。
- 地圖：香港地政總署數碼地圖。
