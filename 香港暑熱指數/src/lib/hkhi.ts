export type Reading = {
  station: string
  timestamp: string
  value: number
}

export type StationSeries = {
  station: string
  latest: Reading
}

export type StationMetadata = {
  name: string
  lat: number
  lng: number
  provisional?: boolean
}

export const stationMetadata: Record<string, StationMetadata> = {
  "Beas River": { name: "雙魚河", lat: 22.493333, lng: 114.105 },
  "Chek Lap Kok": { name: "赤鱲角", lat: 22.309444, lng: 113.921944 },
  "Happy Valley": { name: "跑馬地", lat: 22.270556, lng: 114.183611 },
  "Hong Kong Observatory": { name: "香港天文台", lat: 22.301944, lng: 114.174167 },
  "Kau Sai Chau": { name: "滘西洲", lat: 22.370278, lng: 114.3125 },
  "King's Park": { name: "京士柏", lat: 22.311944, lng: 114.172778 },
  // HKO identifies this HKHI site as ZCP but does not publish a precise coordinate.
  // This provisional point is near CIC-Zero Carbon Park and must be rechecked if HKO publishes one.
  "Kowloon Bay": { name: "九龍灣", lat: 22.3266, lng: 114.2078, provisional: true },
  "Sha Tin": { name: "沙田", lat: 22.4025, lng: 114.21 },
  "Wetland Park": { name: "濕地公園", lat: 22.466667, lng: 114.008889 },
  "Wong Chuk Hang": { name: "黃竹坑", lat: 22.247778, lng: 114.173611 },
}

export function getStationName(station: string) {
  return stationMetadata[station]?.name || station
}

export function getStationMetadata(station: string) {
  return stationMetadata[station]
}

export function parseHkhiCsv(csv: string): StationSeries[] {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","))
    .filter((parts) => parts.length === 3)
    .map(([timestamp, station, rawValue]) => ({
      timestamp: timestamp.trim(),
      station: station.trim(),
      value: Number(rawValue),
    }))
    .filter((row) => /^\d{12}$/.test(row.timestamp) && row.station && Number.isFinite(row.value))
    .filter((row) => Number(row.timestamp.slice(-2)) % 10 === 0)

  const grouped = new Map<string, Reading[]>()
  for (const row of rows) grouped.set(row.station, [...(grouped.get(row.station) || []), row])

  return [...grouped.entries()]
    .map(([station, readings]) => {
      readings.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const latest = readings.at(-1)!
      return {
        station,
        latest,
      }
    })
    .sort((a, b) => b.latest.value - a.latest.value)
}

export function formatTimestamp(value: string, withDate = false) {
  if (!/^\d{12}$/.test(value)) return "未載入"
  const date = new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(4, 6)) - 1,
    Number(value.slice(6, 8)),
    Number(value.slice(8, 10)),
    Number(value.slice(10, 12)),
  )
  return new Intl.DateTimeFormat("zh-HK", {
    ...(withDate ? { month: "short", day: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function getHkhiState(value: number) {
  return value >= 30
    ? { label: "留意暑熱", tone: "hot" as const }
    : { label: "低於 30", tone: "calm" as const }
}
