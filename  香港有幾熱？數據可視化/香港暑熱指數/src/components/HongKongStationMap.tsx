import { useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"
import hongKongMapUrl from "@/assets/hong-kong-official-basemap.png"
import { getStationMetadata, type StationSeries } from "@/lib/hkhi"

type HongKongStationMapProps = {
  stations: StationSeries[]
  activeStation: string
  lockedStation: string | null
  onPreview: (station: string) => void
  onPreviewEnd: () => void
  onToggle: (station: string) => void
  onClear: () => void
}

// The official basemap and station points share the same equirectangular bounds.
const MAP_BOUNDS = {
  minLng: 113.8373315855,
  maxLng: 114.4012964243,
  minLat: 22.1770694221,
  maxLat: 22.5594957837,
}

function project(lat: number, lng: number) {
  return {
    left: ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100,
    top: ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100,
  }
}

export function HongKongStationMap({
  stations,
  activeStation,
  lockedStation,
  onPreview,
  onPreviewEnd,
  onToggle,
  onClear,
}: HongKongStationMapProps) {
  const [mapError, setMapError] = useState(false)

  const nearestStation = (clientX: number, clientY: number, target: HTMLElement) => {
    const bounds = target.getBoundingClientRect()
    let nearest: { station: string; distance: number } | null = null

    for (const series of stations) {
      const metadata = getStationMetadata(series.station)
      if (!metadata) continue
      const position = project(metadata.lat, metadata.lng)
      const x = bounds.left + position.left / 100 * bounds.width
      const y = bounds.top + position.top / 100 * bounds.height
      const distance = Math.hypot(clientX - x, clientY - y)
      if (!nearest || distance < nearest.distance) nearest = { station: series.station, distance }
    }

    return nearest && nearest.distance <= 24 ? nearest.station : null
  }

  const previewNearest = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return
    const station = nearestStation(event.clientX, event.clientY, event.currentTarget)
    station ? onPreview(station) : onPreviewEnd()
  }

  const selectNearest = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.detail === 0) return
    event.stopPropagation()
    const station = nearestStation(event.clientX, event.clientY, event.currentTarget)
    station ? onToggle(station) : onClear()
  }

  return (
    <section
      className="station-map"
      aria-label="香港暑熱指數觀測站地圖"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClear()
      }}
    >
      <div
        className="station-map__canvas"
        onPointerMove={previewNearest}
        onPointerLeave={onPreviewEnd}
        onClickCapture={selectNearest}
      >
        {mapError ? (
          <div className="map-error" role="status">暫時未能顯示香港地圖。</div>
        ) : (
          <svg
            className="station-map__outline"
            viewBox="0 0 1400 950"
            role="img"
            aria-label="香港政府數碼地形底圖，顯示海岸、道路、地形及主要離島"
          >
            <title>香港政府數碼地形底圖</title>
            <defs>
              <filter id="map-relief" x="-4%" y="-4%" width="108%" height="108%">
                <feColorMatrix type="saturate" values="0" result="mono" />
                <feConvolveMatrix
                  in="mono"
                  order="3"
                  kernelMatrix="-2 -1 0 -1 1 1 0 1 2"
                  divisor="1"
                  bias="0.5"
                  preserveAlpha="true"
                  result="emboss"
                />
                <feBlend in="mono" in2="emboss" mode="soft-light" />
              </filter>
            </defs>
            <image
              href={hongKongMapUrl}
              width="1400"
              height="950"
              preserveAspectRatio="none"
              opacity="0.72"
              onError={() => setMapError(true)}
            />
            <image
              href={hongKongMapUrl}
              width="1400"
              height="950"
              preserveAspectRatio="none"
              filter="url(#map-relief)"
              opacity="0.48"
              style={{ mixBlendMode: "multiply" }}
              onError={() => setMapError(true)}
            />
          </svg>
        )}

        {stations.map((series) => {
          const metadata = getStationMetadata(series.station)
          if (!metadata) return null
          const position = project(metadata.lat, metadata.lng)
          const isActive = series.station === activeStation
          const isLocked = series.station === lockedStation
          const isHot = series.latest.value >= 30

          return (
            <button
              type="button"
              className={`station-marker${isActive ? " station-marker--active" : ""}${isLocked ? " station-marker--locked" : ""}${isHot ? " station-marker--hot" : ""}`}
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
              aria-label={`${metadata.name}，香港暑熱指數 ${series.latest.value.toFixed(1)}`}
              aria-pressed={isLocked}
              onClick={(event) => {
                event.stopPropagation()
                if (event.detail === 0) onToggle(series.station)
              }}
              onFocus={() => onPreview(series.station)}
              onBlur={onPreviewEnd}
              key={series.station}
            >
              <span className="station-marker__dot" aria-hidden="true" />
              {isActive && <span className="station-marker__label">{metadata.name}</span>}
            </button>
          )
        })}
      </div>

      <div className="map-legend" aria-label="地圖圖例">
        <span><i className="legend-dot" />觀測站</span>
        <span><i className="legend-dot legend-dot--active" />目前查看</span>
        <span><i className="legend-dot legend-dot--hot" />30 或以上</span>
      </div>
    </section>
  )
}
