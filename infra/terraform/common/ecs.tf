# -----------------------------------------------------------------------------
# ECS Express prerequisites for the data API — cluster, the roles every Express
# service needs, the API's own task role and security group, and its log
# group. Mirrors Pratirupa's per-account ecs.tf. The service object itself
# (create-express-gateway-service, which also provisions the load balancer) is
# created by scripts/deploy/create-data-api-service.sh once an image exists,
# the way Pratirupa creates its services at cutover.
#
# The tasks run in the default VPC's public subnets with public addresses
# (there is no NAT in this account) and reach the database over its private
# address: the database security group admits 5432 from the task security
# group, nothing else does.
# -----------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "dbie-common"
  tags = { Name = "dbie-common" }
}

# --- Execution role: ECR pull + CloudWatch logs (standard managed policy) ----
resource "aws_iam_role" "ecs_execution" {
  name = "dbie-common-ecs-execution"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = { Name = "dbie-common-ecs-execution" }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- Infrastructure role: lets ECS manage the Express gateway (ALB etc.) -----
resource "aws_iam_role" "ecs_infra" {
  name = "dbie-common-ecs-infra"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = { Name = "dbie-common-ecs-infra" }
}

resource "aws_iam_role_policy_attachment" "ecs_infra" {
  role       = aws_iam_role.ecs_infra.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices"
}

resource "aws_iam_role_policy" "ecs_infra_ec2" {
  name = "ec2-account-attrs"
  role = aws_iam_role.ecs_infra.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Sid = "Ec2AccountAttrs", Effect = "Allow", Action = "ec2:DescribeAccountAttributes", Resource = "*" }]
  })
}

# --- The API's task role: read the reader secret, nothing else ---------------
resource "aws_iam_role" "data_api_task" {
  name = "dbie-common-data-api-task"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = { Name = "dbie-common-data-api-task" }
}

resource "aws_iam_role_policy" "data_api_task" {
  name = "data-api-access"
  role = aws_iam_role.data_api_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "ReaderSecret"
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = ["arn:aws:secretsmanager:${var.region}:${var.common_account_id}:secret:dbie/db-common-reader-*"]
    }]
  })
}

# --- Task security group; the database admits it ------------------------------
resource "aws_security_group" "data_api" {
  name        = "dbie-data-api-sg"
  description = "DBIE data API tasks: egress only; the DB SG admits 5432 from here"
  vpc_id      = data.aws_vpc.default.id
  tags        = { Name = "dbie-data-api-sg" }
}

resource "aws_vpc_security_group_egress_rule" "data_api_all" {
  security_group_id = aws_security_group.data_api.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "db_from_data_api" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.data_api.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "data API tasks"
}

resource "aws_cloudwatch_log_group" "data_api" {
  name              = "/ecs/dbie-data-api"
  retention_in_days = 30
  tags              = { Name = "/ecs/dbie-data-api" }
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_execution_role_arn" {
  value = aws_iam_role.ecs_execution.arn
}

output "ecs_infra_role_arn" {
  value = aws_iam_role.ecs_infra.arn
}

output "data_api_task_role_arn" {
  value = aws_iam_role.data_api_task.arn
}

output "data_api_security_group_id" {
  value = aws_security_group.data_api.id
}

output "data_api_subnet_ids" {
  value = data.aws_subnets.default.ids
}
