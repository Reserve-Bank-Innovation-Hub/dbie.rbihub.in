# =============================================================================
# Terraform state backend — bootstrap
# =============================================================================
# Creates the S3 bucket that holds Terraform state for the DBIE infrastructure,
# inside the common-projects account (588387717844). Same shape as Pratirupa's
# bootstrap: this config CREATES the state bucket, so it cannot keep its own
# state there and uses LOCAL state. The bucket is the only resource here and is
# trivially re-importable. Everything else (common/) uses it as its backend.
#
# Run with management creds — the provider assume-roles into common-projects:
#   AWS_PROFILE=default terraform -chdir=infra/terraform/bootstrap apply
# =============================================================================

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "common_account_id" {
  description = "common-projects account id — DBIE's database, bastion, buckets and this state bucket live here."
  type        = string
  default     = "588387717844"
}

provider "aws" {
  region = var.region

  assume_role {
    role_arn     = "arn:aws:iam::${var.common_account_id}:role/OrganizationAccountAccessRole"
    session_name = "tf-dbie-bootstrap"
  }

  default_tags {
    tags = {
      Project   = "dbie"
      ManagedBy = "terraform"
      Account   = "common-projects"
    }
  }
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "dbie-common-terraform-state"

  # Never let `terraform destroy` nuke the state bucket.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "state_bucket" {
  value = aws_s3_bucket.tfstate.id
}
