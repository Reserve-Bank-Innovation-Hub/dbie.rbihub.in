# -----------------------------------------------------------------------------
# Container images, namespace dbie/ (Pratirupa: pratirupa/<service>). The
# deploy-data-api workflow pushes a multi-arch image tagged :common; the ECS
# Express service pulls it.
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "data_api" {
  name                 = "dbie/data-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "dbie/data-api" }
}

# Keep the repo tidy: drop untagged images after 14 days.
resource "aws_ecr_lifecycle_policy" "data_api" {
  repository = aws_ecr_repository.data_api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = { type = "expire" }
    }]
  })
}

output "ecr_repo_url" {
  value = aws_ecr_repository.data_api.repository_url
}
