import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Clock3 } from "lucide-react"
import { HongKongStationMap } from "@/components/HongKongStationMap"
import {
  formatTimestamp,
  getStationMetadata,
  getStationName,
  parseHkhiCsv,
  type StationSeries,
} from "@/lib/hkhi"

const REFRESH_MS = 10 * 60_000

export default function App() {
  const [stations, setStations] = useState<StationSeries[]>([])
  const [previewStation, setPreviewStation] = useState<string | null>(null)
  const [lockedStation, setLockedStation] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/hkhi", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const next = parseHkhiCsv(await response.text())
      if (!next.length) throw new Error("CSV 沒有有效的十分鐘讀數")
      setStations(next)
      setError("")
    } catch {
      setError("暫時未能讀取天文台數據，請稍後再試。")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (lockedStation && !stations.some((item) => item.station === lockedStation)) {
      setLockedStation(null)
    }
  }, [lockedStation, stations])

  const summary = useMemo(() => {
    if (!stations.length) return null
    const hottest = stations[0]
    const average = stations.reduce((total, item) => total + item.latest.value, 0) / stations.length
    const latestTime = stations.reduce(
      (latest, item) => (item.latest.timestamp > latest ? item.latest.timestamp : latest),
      "",
    )
    return { hottest, average, latestTime, hotCount: stations.filter((item) => item.latest.value >= 30).length }
  }, [stations])

  const activeStation = previewStation || lockedStation || summary?.hottest.station || ""
  const activeSeries = stations.find((item) => item.station === activeStation) || summary?.hottest
  const activeMetadata = activeSeries ? getStationMetadata(activeSeries.station) : undefined

  const clearSelection = () => {
    setPreviewStation(null)
    setLockedStation(null)
  }

  return (
    <main>
      <article className="dashboard" id="content">
        <header className="page-header">
          <div>
            <h1>香港暑熱指數</h1>
            <p>綜合氣溫、濕度、風速及太陽輻射的體感暑熱指標</p>
          </div>
          <div className="update-time">
            <Clock3 size={16} aria-hidden="true" />
            <span>更新：{summary ? formatTimestamp(summary.latestTime, true) : "未載入"}</span>
          </div>
        </header>

        {error && (
          <div className="error-state" role="alert">
            <span>{error}</span>
            <button type="button" onClick={load}>重新載入</button>
          </div>
        )}

        {loading && !stations.length ? (
          <div className="content-layout content-layout--loading" aria-label="正在載入">
            <div className="map-skeleton skeleton" aria-hidden="true" />
            <div className="panel-skeleton skeleton" aria-hidden="true" />
          </div>
        ) : (
          <div className="content-layout">
            <HongKongStationMap
              stations={stations}
              activeStation={activeStation}
              lockedStation={lockedStation}
              onPreview={setPreviewStation}
              onPreviewEnd={() => setPreviewStation(null)}
              onToggle={(station) => {
                setPreviewStation(null)
                setLockedStation((current) => current === station ? null : station)
              }}
              onClear={clearSelection}
            />

            <aside className="reading-panel" aria-label="目前觀測站讀數" aria-live="polite">
              {activeSeries && summary ? (
                <>
                  <section className="current-reading">
                    <p>目前查看</p>
                    <h2>{getStationName(activeSeries.station)}</h2>
                    <div className="current-reading__value">
                      <strong>{activeSeries.latest.value.toFixed(1)}</strong>
                      <span>HKHI</span>
                    </div>
                    <small aria-hidden={!activeMetadata?.provisional}>
                      {activeMetadata?.provisional ? "站點位置為待官方核實的暫定標示" : "\u00a0"}
                    </small>
                  </section>

                  <dl className="summary-list">
                    <div>
                      <dt>全港最高</dt>
                      <dd><b>{summary.hottest.latest.value.toFixed(1)}</b><span>{getStationName(summary.hottest.station)}</span></dd>
                    </div>
                    <div>
                      <dt>測站平均</dt>
                      <dd><b>{summary.average.toFixed(1)}</b><span>HKHI</span></dd>
                    </div>
                    <div>
                      <dt>達 30 測站</dt>
                      <dd><b>{summary.hotCount}</b><span>／{stations.length}</span></dd>
                    </div>
                  </dl>

                  <div className="threshold-note">
                    <AlertTriangle size={19} aria-hidden="true" />
                    <p><b>30 是重要參考線</b><br />京士柏約 30 或以上時，應採取適當防暑措施。</p>
                  </div>
                </>
              ) : (
                <div className="panel-empty">暫時沒有可顯示的讀數。</div>
              )}
            </aside>
          </div>
        )}

        <footer>
          <p>數值為顯示時間前 10 分鐘的平均數；屬臨時數據，只經有限度驗證。</p>
          <div className="source-links">
            <a href="https://www.hko.gov.hk/tc/wxinfo/ts/index_hkhi.htm" target="_blank" rel="noreferrer">數據來源：香港天文台</a>
            <a href="https://www.hko.gov.hk/tc/cis/stn.htm" target="_blank" rel="noreferrer">觀測站位置：香港天文台氣象站資料</a>
            <a href="https://www.landsd.gov.hk/tc/survey-mapping/mapping/multi-scale-topographic-mapping/digital-map.html" target="_blank" rel="noreferrer">地圖：香港地政總署數碼地圖</a>
          </div>
        </footer>
      </article>
    </main>
  )
}
