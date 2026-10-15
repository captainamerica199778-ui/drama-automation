const { execSync } = require('child_process')

// Ensure DATABASE_URL is always defined so Prisma schema validation never fails
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

console.log('[build.js] Using DATABASE_URL:', process.env.DATABASE_URL.startsWith('file:') ? 'file:./dev.db' : '[REDACTED_CLOUD_DB]')

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
