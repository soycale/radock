import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import { configuration } from '#application/configuration.js'

const pool = new pg.Pool({ connectionString: configuration.databaseUrl })

export type AppDatabase = Record<string, never>

export const db = new Kysely<AppDatabase>({
  dialect: new PostgresDialect({ pool }),
  plugins: [new CamelCasePlugin()],
})
