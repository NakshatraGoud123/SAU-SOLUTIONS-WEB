import { createClient } from '@supabase/supabase-js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const tables = [
  'profiles',
  'categories',
  'services',
  'products',
  'addresses',
  'cart',
  'carts',
  'cart_items',
  'bookings',
  'orders',
  'order_items',
  'reviews',
  'notifications',
  'partner_profiles',
]

function getKeyRole(key) {
  const [, payload] = key.split('.')
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'))
    return claims.role ?? null
  } catch {
    return null
  }
}

function isMissingTable(error) {
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || /could not find the table|relation .* does not exist/i.test(error.message)
}

export async function checkSupabaseConnection(env = loadEnv('development', process.cwd(), 'VITE_')) {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey || url === 'YOUR_SUPABASE_PROJECT_URL' || anonKey === 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY') {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local before running this check.')
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid absolute URL.')
  }

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    throw new Error('VITE_SUPABASE_URL must use HTTP or HTTPS.')
  }

  const keyRole = getKeyRole(anonKey)
  if (keyRole === 'service_role' || anonKey.startsWith('sb_secret_')) {
    throw new Error('This check requires a public anon/publishable key; service_role/secret keys are not allowed.')
  }

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const restResponse = await fetch(
    `${parsedUrl.origin}${parsedUrl.pathname.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=0`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    },
  )

  const tableResults = []
  for (const table of tables) {
    const { error } = await client.from(table).select('id').limit(0)
    tableResults.push({
      table,
      status: error ? (isMissingTable(error) ? 'missing' : 'error') : 'available',
      error: error ? `${error.code ? `${error.code}: ` : ''}${error.message}` : null,
    })
  }

  return {
    restApi: { reachable: restResponse.ok, status: restResponse.status },
    keyRole,
    tables: tableResults,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = await checkSupabaseConnection()
    console.log(`Supabase REST API: ${result.restApi.reachable ? 'reachable' : 'request failed'} (HTTP ${result.restApi.status})`)
    console.log(`Public key role: ${result.keyRole ?? 'non-JWT public key'}`)
    console.log('Table probes: read-only select(id) with limit 0; no records are fetched or created.')

    for (const tableResult of result.tables) {
      const detail = tableResult.error ? ` — ${tableResult.error}` : ''
      console.log(`${tableResult.status}: ${tableResult.table}${detail}`)
    }

    console.log('RLS policies: their live definitions cannot be enumerated with an anon key.')

    if (!result.restApi.reachable) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Supabase connection check failed.')
    process.exitCode = 1
  }
}
