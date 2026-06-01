import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import { configuration } from '#application/configuration.js'
import type { DB } from '#data/db.js'

export type AppDatabase = Kysely<DB>

const pool = new pg.Pool({ connectionString: configuration.databaseUrl })

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
  plugins: [new CamelCasePlugin()],
})
