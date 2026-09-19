#!/usr/bin/env node
// Creates the two working database roles and writes their secrets, Pratirupa's shape {host, port, dbname, username,
// password}, one secret per role (infra/terraform/common/secrets.tf owns the containers):
//   dbie_loader  owns every DBIE schema and table; used by the loaders (DB_SECRET_NAME=dbie/db-common)
//   dbie_reader  SELECT on everything, now and in future; analysts, DataGrip, the MCP server (dbie/db-common-reader)
// Runs as the master user, whose RDS-managed secret rotates weekly and is used for nothing else. Re-runnable: existing
// roles get a fresh password, ownership and grants are re-applied.
//   node scripts/db/create-roles.mjs
import crypto from 'node:crypto';
import { DATA_SCHEMAS, psql, tsvRows, ql, aws, loadEnvFile } from './lib.mjs';

loadEnvFile();
const REGION = process.env.AWS_REGION || 'ap-south-1';
const INSTANCE = process.env.DB_INSTANCE_ID || 'dbie-postgres';
const SCHEMAS = [...DATA_SCHEMAS, 'meta'];
const ROLES = [
    { role: 'dbie_loader', secret: process.env.DB_SECRET_NAME || 'dbie/db-common' },
    { role: 'dbie_reader', secret: process.env.DB_READER_SECRET_NAME || 'dbie/db-common-reader' },
];

// Connect as the master user for this run only.
const masterArn = aws('rds', 'describe-db-instances', '--db-instance-identifier', INSTANCE, '--query', 'DBInstances[0].MasterUserSecret.SecretArn');
const endpoint = aws('rds', 'describe-db-instances', '--db-instance-identifier', INSTANCE, '--query', 'DBInstances[0].[Endpoint.Address,Endpoint.Port,DBName]').split(/\s+/);
const master = JSON.parse(aws('secretsmanager', 'get-secret-value', '--secret-id', masterArn, '--query', 'SecretString'));
Object.assign(process.env, { PGHOST: endpoint[0], PGPORT: endpoint[1], PGDATABASE: endpoint[2], PGUSER: master.username, PGPASSWORD: master.password });

const password = () => crypto.randomBytes(24).toString('base64url');
const passwords = Object.fromEntries(ROLES.map(r => [r.role, password()]));

const existing = new Set(tsvRows(await psql(`SELECT rolname FROM pg_roles WHERE rolname IN (${ROLES.map(r => ql(r.role)).join(',')});`)).map(r => r[0]));
const sql = [];
for (const { role } of ROLES) sql.push(existing.has(role) ? `ALTER ROLE ${role} WITH LOGIN PASSWORD ${ql(passwords[role])};` : `CREATE ROLE ${role} WITH LOGIN PASSWORD ${ql(passwords[role])};`);
sql.push(`GRANT CONNECT ON DATABASE ${process.env.PGDATABASE} TO dbie_loader, dbie_reader;`);
sql.push(`GRANT CREATE ON DATABASE ${process.env.PGDATABASE} TO dbie_loader;`);
// The master must be a member of the new owner to hand objects over, and stays one so it can still manage them.
sql.push(`GRANT dbie_loader TO ${process.env.PGUSER};`);
for (const s of SCHEMAS) sql.push(`ALTER SCHEMA ${s} OWNER TO dbie_loader;`);
const owned = tsvRows(await psql(`SELECT n.nspname, c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles o ON o.oid = c.relowner WHERE n.nspname IN (${SCHEMAS.map(ql).join(',')}) AND c.relkind IN ('r','v') AND o.rolname <> 'dbie_loader' ORDER BY c.relkind, 1, 2;`)); // serial sequences follow their table's owner
for (const [schema, name, kind] of owned) sql.push(`ALTER ${kind === 'v' ? 'VIEW' : 'TABLE'} "${schema}"."${name}" OWNER TO dbie_loader;`);
for (const s of SCHEMAS) {
    sql.push(`GRANT USAGE ON SCHEMA ${s} TO dbie_reader;`);
    sql.push(`GRANT SELECT ON ALL TABLES IN SCHEMA ${s} TO dbie_reader;`);
    sql.push(`ALTER DEFAULT PRIVILEGES FOR ROLE dbie_loader IN SCHEMA ${s} GRANT SELECT ON TABLES TO dbie_reader;`);
}
await psql(`BEGIN;\n${sql.join('\n')}\nCOMMIT;\n`);
console.log(`roles ${existing.size ? 'updated' : 'created'}: ${ROLES.map(r => r.role).join(', ')}; ${owned.length} objects handed to dbie_loader`);

// Secret values (containers exist from Terraform; created here if not).
for (const { role, secret } of ROLES) {
    const value = JSON.stringify({ host: endpoint[0], port: endpoint[1], dbname: endpoint[2], username: role, password: passwords[role] });
    try { aws('secretsmanager', 'put-secret-value', '--secret-id', secret, '--secret-string', value); }
    catch { aws('secretsmanager', 'create-secret', '--name', secret, '--secret-string', value); }
    console.log(`secret ${secret}: ${role} @ ${endpoint[0]}`);
}
