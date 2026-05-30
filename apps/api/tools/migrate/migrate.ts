import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const migrationsDir = join(__dirname, '../../data/migrations')
const databaseUrl = process.env.DATABASE_URL

const [command, ...args] = process.argv.slice(2)

function migrate(direction: string, steps?: string) {
  const stepFlag = steps ? `-steps ${steps}` : ''
  execSync(
    `migrate -path ${migrationsDir} -database "${databaseUrl}" ${direction} ${stepFlag}`,
    { stdio: 'inherit' },
  )
}

switch (command) {
  case 'up':
    migrate('up')
    break

  case 'down':
    migrate('down', args[0] ?? '1')
    break

  case 'status':
    execSync(
      `migrate -path ${migrationsDir} -database "${databaseUrl}" version`,
      { stdio: 'inherit' },
    )
    break

  case 'create': {
    const name = args[0]
    if (!name) {
      console.error('Usage: migrate create <name>')
      process.exit(1)
    }
    const timestamp = Date.now()
    mkdirSync(migrationsDir, { recursive: true })
    writeFileSync(join(migrationsDir, `${timestamp}_${name}.up.sql`), '')
    writeFileSync(join(migrationsDir, `${timestamp}_${name}.down.sql`), '')
    console.log(`Created migration: ${timestamp}_${name}`)
    break
  }

  default:
    console.error('Usage: migrate <up|down [N]|status|create <name>>')
    process.exit(1)
}
