# -----------------------------------------------------------------------------
# Database secrets, Pratirupa's shape: JSON {host, port, dbname, username,
# password}, one per database role, read by name (DB_SECRET_NAME in
# .env.common). Terraform owns the containers only; the values are written out
# of band by scripts/db/create-roles.mjs, so no password passes through state.
#
#   dbie/db-common         dbie_loader — owns the data schemas; used by the
#                          loaders and the release build
#   dbie/db-common-reader  dbie_reader — SELECT on everything; analysts,
#                          DataGrip, the MCP server
#
# The master user (dbie_admin) keeps its RDS-managed secret, which rotates on
# RDS's schedule; nothing day to day depends on it.
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "db_loader" {
  name                    = "dbie/db-common"
  description             = "DBIE Postgres, loader role: owns the data schemas"
  recovery_window_in_days = 7
  tags                    = { Name = "dbie/db-common" }
}

resource "aws_secretsmanager_secret" "db_reader" {
  name                    = "dbie/db-common-reader"
  description             = "DBIE Postgres, read-only role for analysts and the MCP server"
  recovery_window_in_days = 7
  tags                    = { Name = "dbie/db-common-reader" }
}
