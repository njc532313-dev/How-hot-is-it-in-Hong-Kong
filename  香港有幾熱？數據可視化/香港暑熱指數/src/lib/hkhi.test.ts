import assert from "node:assert/strict"
import test from "node:test"
import { formatTimestamp, getStationName, parseHkhiCsv, stationMetadata } from "./hkhi.ts"

test("keeps only the latest ten-minute update for each station", () => {
  const csv = [
    "Date time,Automatic Weather Station,10 minute mean Hong Kong Heat Index",
    "202609201310,King's Park,29.8",
    "202609201310,Sha Tin,31.0",
    "202609201311,King's Park,30.1",
    "202609201311,Sha Tin,33.8",
    "202609201320,King's Park,30.2",
    "202609201320,Sha Tin,30.7",
    "202609201321,King's Park,35.1",
  ].join("\n")
  const result = parseHkhiCsv(csv)
  assert.deepEqual(result.map(({ station }) => station), ["Sha Tin", "King's Park"])
  assert.equal(result[0].latest.value, 30.7)
  assert.equal(formatTimestamp(result[0].latest.timestamp), "13:20")
})

test("provides display names and Hong Kong coordinates for all HKHI stations", () => {
  const stations = [
    "Beas River",
    "Chek Lap Kok",
    "Happy Valley",
    "Hong Kong Observatory",
    "Kau Sai Chau",
    "King's Park",
    "Kowloon Bay",
    "Sha Tin",
    "Wetland Park",
    "Wong Chuk Hang",
  ]

  assert.equal(Object.keys(stationMetadata).length, 10)
  for (const station of stations) {
    const metadata = stationMetadata[station]
    assert.ok(metadata, `missing metadata for ${station}`)
    assert.ok(metadata.name, `missing Chinese name for ${station}`)
    assert.ok(Number.isFinite(metadata.lat), `invalid latitude for ${station}`)
    assert.ok(Number.isFinite(metadata.lng), `invalid longitude for ${station}`)
    assert.ok(metadata.lat >= 22.15 && metadata.lat <= 22.6, `latitude outside Hong Kong for ${station}`)
    assert.ok(metadata.lng >= 113.8 && metadata.lng <= 114.45, `longitude outside Hong Kong for ${station}`)
  }

  assert.equal(getStationName("Beas River"), "雙魚河")
})
