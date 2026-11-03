// The footage server the film reads its app captures from (src/fx/kit.tsx FOOTAGE = http://127.0.0.1:5699):
//   node tools/footage/serve.mjs <footage dir> 5699   (127.0.0.1 only)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [dirArg, port] = process.argv.slice(2)
// Resolved once, so a relative folder works too (the containment check below compares against it).
const dir = path.resolve(dirArg)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.map': 'application/json',
}
http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0])
    let file = path.join(dir, path.normalize(url).replace(/^([\\/])+/, ''))
    if (!file.startsWith(path.resolve(dir))) file = path.join(dir, 'index.html')
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html')
    // A folder with no index.html (the footage clips) answers 404 instead of crashing on the missing file.
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
      return
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res)
  })
  .listen(Number(port), '127.0.0.1', () => console.log(`static ${dir} on ${port}`))
