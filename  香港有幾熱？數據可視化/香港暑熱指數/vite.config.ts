import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": decodeURIComponent(new URL("./src", import.meta.url).pathname) } },
  server: {
    proxy: {
      "/api/hkhi": {
        target: "https://data.weather.gov.hk",
        changeOrigin: true,
        rewrite: () => "/weatherAPI/hko_data/regional-weather/recent10_10min_hkhi.csv",
      },
    },
  },
})
