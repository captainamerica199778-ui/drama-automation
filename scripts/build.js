const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Normalize and auto-fallback DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

const isPostgres = process.env.DATABASE_URL.startsWith('postgres')
const isMysql = process.env.DATABASE_URL.startsWith('mysql')
const targetProvider = isPostgres ? 'postgresql' : isMysql ? 'mysql' : 'sqlite'

console.log('[build.js] Target database provider:', targetProvider)

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, 'utf8')
  if (isPostgres || isMysql) {
    console.log(`[build.js] Adapting Prisma datasource provider to ${targetProvider}...`)
    schema = schema.replace(/provider\s*=\s*"sqlite"/, `provider = "${targetProvider}"`)
    fs.writeFileSync(schemaPath, schema)
    execSync('npx prisma generate', { stdio: 'inherit', env: process.env })
  }
}

try {
  console.log('[build.js] Syncing database schema...')
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  })

  console.log('[build.js] Building Next.js application...')
  execSync('npx next build', {
    stdio: 'inherit',
    env: process.env,
  })
} catch (error) {
  console.error('[build.js] Build failed:', error.message)
  process.exit(1)
}
