import { copyFile, access } from 'node:fs/promises'
import { join } from 'node:path'

const indexPath = join('dist', 'index.html')
const fallbackPath = join('dist', '404.html')
await access(indexPath)
await copyFile(indexPath, fallbackPath)
console.log('Created dist/404.html for GitHub Pages client-side route fallback.')
