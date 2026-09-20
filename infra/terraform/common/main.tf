# =============================================================================
# dbie-common — the DBIE data platform in the common-projects account
# =============================================================================
# One root for everything DBIE runs in the common-projects account
# (588387717844): the Postgres database that is the system of record for the
# scraped DBIE data, the SSM bastion that doubles as the tailnet subnet router,
# the S3 buckets that hold scrape archives and site data releases, the DB
# secret containers and the GitHub Actions release role. Same conventions as
# Pratirupa's per-account roots: provider assume-roles into the account, state
# in the account's state bucket (bootstrap/), files split by concern.
#
# The database, bastion, security groups and parameter group were first created
# by hand on 18-09-2026 and imported; see docs/database.md for the import list.
#
#   AWS_PROFILE=default terraform -chdir=infra/terraform/common plan
#   AWS_PROFILE=default terraform -chdir=infra/terraform/common apply
# =============================================================================

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "dbie-common-terraform-state"
    key          = "common/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
    assume_role = {
      role_arn = "arn:aws:iam::588387717844:role/OrganizationAccountAccessRole"
    }
  }
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "common_account_id" {
  type    = string
  default = "588387717844"
}

variable "github_repo" {
  description = "GitHub repository allowed to assume the release role."
  type        = string
  default     = "Reserve-Bank-Innovation-Hub/dbie.rbihub.in"
}

variable "release_branches" {
  description = "Branches whose workflows may assume the release role."
  type        = list(string)
  default     = ["dev", "main"]
}

provider "aws" {
  region = var.region

  assume_role {
    role_arn     = "arn:aws:iam::${var.common_account_id}:role/OrganizationAccountAccessRole"
    session_name = "tf-dbie-common"
  }

  default_tags {
    tags = {
      Project   = "dbie"
      ManagedBy = "terraform"
      Account   = "common-projects"
    }
  }
}

# us-east-1 provider alias: a CloudFront distribution's certificate must live in us-east-1.
provider "aws" {
  alias  = "use1"
  region = "us-east-1"

  assume_role {
    role_arn     = "arn:aws:iam::${var.common_account_id}:role/OrganizationAccountAccessRole"
    session_name = "tf-dbie-common-use1"
  }

  default_tags {
    tags = {
      Project   = "dbie"
      ManagedBy = "terraform"
      Account   = "common-projects"
    }
  }
}
