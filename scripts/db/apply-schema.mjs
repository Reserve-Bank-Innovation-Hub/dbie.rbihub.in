#!/usr/bin/env node
// Applies scripts/db/schema.sql (schemas, meta tables, the meta.tables view) to the database. Idempotent.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { psql, tsvRows } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
await psql(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));
const schemas = tsvRows(await psql("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg\\_%' AND nspname NOT IN ('information_schema', 'public') ORDER BY 1;")).map(r => r[0]);
console.log(`schema applied; schemas: ${schemas.join(', ')}`);
