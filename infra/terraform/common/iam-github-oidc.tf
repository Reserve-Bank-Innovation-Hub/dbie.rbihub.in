# -----------------------------------------------------------------------------
# GitHub Actions OIDC release role — lets .github/workflows/release-data.yml
# fetch a scrape archive and publish a site data release with no static keys.
# Mirrors Pratirupa's pratirupa-github-actions-deploy: OIDC provider, a role
# trusted only by this repository's release branches, least-privilege policy.
# Both buckets are world-readable, so the role adds only the writes.
# -----------------------------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
  tags            = { Name = "github-actions-oidc" }
}

resource "aws_iam_role" "github_actions_release" {
  name                 = "dbie-github-actions-release"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [for b in var.release_branches : "repo:${var.github_repo}:ref:refs/heads/${b}"]
        }
      }
    }]
  })

  tags = { Name = "dbie-github-actions-release" }
}

resource "aws_iam_role_policy" "github_actions_release" {
  name = "release-permissions"
  role = aws_iam_role.github_actions_release.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListBuckets"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.scrapes.arn, aws_s3_bucket.site_data.arn]
      },
      {
        Sid      = "ReadScrapes"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.scrapes.arn}/*"
      },
      {
        Sid      = "PublishReleases"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.site_data.arn}/releases/*"
      },
    ]
  })
}

# -----------------------------------------------------------------------------
# GitHub Actions OIDC deploy role — lets .github/workflows/deploy-data-api.yml
# push the API image and force a new deployment of the ECS service, with no
# static keys. Pratirupa's <project>-github-actions-deploy, for this account.
# -----------------------------------------------------------------------------

resource "aws_iam_role" "github_actions_deploy" {
  name                 = "dbie-github-actions-deploy"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [for b in var.release_branches : "repo:${var.github_repo}:ref:refs/heads/${b}"]
        }
      }
    }]
  })

  tags = { Name = "dbie-github-actions-deploy" }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "deploy-permissions"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ECRAuthToken"
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = aws_ecr_repository.data_api.arn
      },
      {
        Sid      = "ECSForceDeploy"
        Effect   = "Allow"
        Action   = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = "arn:aws:ecs:${var.region}:${var.common_account_id}:service/${aws_ecs_cluster.main.name}/*"
      },
    ]
  })
}

output "github_actions_deploy_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}
