# What the tooling and the docs point at. Copy these into .env.common.

output "db_endpoint" {
  value = aws_db_instance.postgres.address
}

output "db_master_secret_arn" {
  value = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

output "db_loader_secret_name" {
  value = aws_secretsmanager_secret.db_loader.name
}

output "db_reader_secret_name" {
  value = aws_secretsmanager_secret.db_reader.name
}

output "bastion_instance_id" {
  value = aws_instance.bastion.id
}

output "scrapes_bucket" {
  value = aws_s3_bucket.scrapes.id
}

output "site_data_bucket" {
  value = aws_s3_bucket.site_data.id
}

output "github_actions_release_role_arn" {
  value = aws_iam_role.github_actions_release.arn
}
