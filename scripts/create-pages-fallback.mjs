import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const indexPath = join('dist', 'index.html')
const fallbackPath = join('dist', '404.html')
const seoConfig = JSON.parse(await readFile('seo-routes.json', 'utf8'))

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function setMeta(html, attribute, key, content) {
  const tagPattern = new RegExp(`<meta\\s+[^>]*\\b${attribute}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`
  return tagPattern.test(html)
    ? html.replace(tagPattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`)
}

function setCanonical(html, href) {
  const tagPattern = /<link\s+[^>]*\brel=["']canonical["'][^>]*>/i
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`
  return tagPattern.test(html)
    ? html.replace(tagPattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`)
}

function withMetadata(html, metadata) {
  const canonicalUrl = new URL(metadata.canonicalPath.replace(/^\//, ''), seoConfig.siteUrl).href
  let result = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
  result = setMeta(result, 'name', 'description', metadata.description)
  result = setMeta(result, 'property', 'og:title', metadata.title)
  result = setMeta(result, 'property', 'og:description', metadata.socialDescription ?? metadata.description)
  result = setMeta(result, 'property', 'og:url', canonicalUrl)
  return setCanonical(result, canonicalUrl)
}

await access(indexPath)
const homepageHtml = withMetadata(await readFile(indexPath, 'utf8'), seoConfig.routes['/'])
await writeFile(indexPath, homepageHtml)
for (const [route, metadata] of Object.entries(seoConfig.routes)) {
  if (route === '/') continue
  const routeDirectory = join('dist', ...route.split('/').filter(Boolean))
  await mkdir(routeDirectory, { recursive: true })
  const routeHtml = withMetadata(homepageHtml, metadata)
  await writeFile(join(routeDirectory, 'index.html'), routeHtml)
}
const notFoundHtml = homepageHtml
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Page Not Found | SAU SOLUTIONS</title>')
  .replace(/<link\s+[^>]*\brel=["']canonical["'][^>]*>\s*/i, '')
  .replace(/<meta\s+[^>]*\bproperty=["']og:url["'][^>]*>\s*/i, '')
let fallbackHtml = setMeta(notFoundHtml, 'name', 'description', 'The requested page does not match a page on the SAU SOLUTIONS website.')
fallbackHtml = setMeta(fallbackHtml, 'property', 'og:title', 'Page Not Found | SAU SOLUTIONS')
fallbackHtml = setMeta(fallbackHtml, 'property', 'og:description', 'The requested page does not match a page on the SAU SOLUTIONS website.')
await writeFile(fallbackPath, fallbackHtml)
console.log(`Created ${Object.keys(seoConfig.routes).length - 1} prerendered route pages and a non-canonical dist/404.html fallback.`)
