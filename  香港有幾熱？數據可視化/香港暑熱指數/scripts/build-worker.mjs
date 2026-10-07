import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve, sep } from "node:path"

const projectRoot = resolve(import.meta.dirname, "..")
const distRoot = join(projectRoot, "dist")
const workerSourcePath = join(projectRoot, "worker", "index.js")
const workerOutputPath = join(distRoot, "server", "index.js")
const manifestSourcePath = join(projectRoot, ".openai", "hosting.json")
const manifestOutputPath = join(distRoot, ".openai", "hosting.json")

async function collectFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "server" || entry.name === ".openai") continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(path))
    else files.push(path)
  }
  return files
}

const assets = {}
for (const path of await collectFiles(distRoot)) {
  const pathname = `/${relative(distRoot, path).split(sep).join("/")}`
  assets[pathname] = (await readFile(path)).toString("base64")
}

if (!assets["/index.html"]) throw new Error("Vite output is missing dist/index.html")

const workerSource = await readFile(workerSourcePath, "utf8")
const bundledWorker = workerSource.replace("__STATIC_ASSETS__", JSON.stringify(assets))
if (bundledWorker === workerSource) throw new Error("Worker asset placeholder was not found")

await mkdir(join(distRoot, "server"), { recursive: true })
await mkdir(join(distRoot, ".openai"), { recursive: true })
await writeFile(workerOutputPath, bundledWorker)
await copyFile(manifestSourcePath, manifestOutputPath)

console.log(`Bundled ${Object.keys(assets).length} static files for Sites`)
