# -----------------------------------------------------------------------------
# The database: RDS for PostgreSQL 18, db.t4g.large, 20 GiB gp3 growing to 100,
# Single-AZ, encrypted, TLS forced. Private (no public address, security group
# from the bastion only). The master password is an RDS-managed secret; day to
# day access uses the loader and reader roles in secrets.tf.
#
# db.t4g.large rather than the cheaper t4g.medium because Mumbai had no t4g
# capacity on 18-09-2026 until this class appeared; drop to t4g.medium with a
# class change when capacity allows. Minor versions auto-upgrade, so
# engine_version drift is ignored.
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "db" {
  name        = "dbie-db-subnets"
  description = "DBIE Postgres: default-VPC subnets, 3 AZs"
  subnet_ids  = data.aws_subnets.default.ids
  tags        = { Name = "dbie-db-subnets" }
}

resource "aws_db_parameter_group" "pg18" {
  name        = "dbie-pg18"
  family      = "postgres18"
  description = "DBIE Postgres 18: analytics-leaning memory, slow-query log, TLS forced"
  tags        = { Name = "dbie-pg18" }

  parameter {
    name  = "work_mem"
    value = "65536" # kB: 64 MB per sort or hash, analytical queries over a few connections
  }
  parameter {
    name  = "maintenance_work_mem"
    value = "262144" # kB: 256 MB for index builds during loads
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # ms: log statements slower than a second
  }
  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "pending-reboot" # how RDS reports this parameter; "immediate" would show as drift on every plan
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "dbie-postgres"
  engine         = "postgres"
  engine_version = "18.6"
  instance_class = "db.t4g.large"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name                     = "dbie"
  username                    = "dbie_admin"
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.pg18.name
  publicly_accessible    = false
  multi_az               = false
  availability_zone      = "${var.region}c"

  backup_retention_period   = 7
  backup_window             = "20:00-21:00"         # 01:30–02:30 IST
  maintenance_window        = "sat:21:30-sat:22:30" # Sunday 03:00–04:00 IST
  copy_tags_to_snapshot     = true
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "dbie-postgres-final"

  auto_minor_version_upgrade            = true
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]

  lifecycle {
    ignore_changes = [engine_version]
  }

  tags = { Name = "dbie-postgres" }
}
