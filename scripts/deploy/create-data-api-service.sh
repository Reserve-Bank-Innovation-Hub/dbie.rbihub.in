#!/bin/bash
# Creates the data API's ECS Express gateway service (the service plus the load balancer ECS manages for it) from
# the Terraform outputs, the way Pratirupa creates its services at cutover. One-time; afterwards the
# deploy-data-api workflow pushes images and forces new deployments. Needs an image at <ecr_repo_url>:common.
#   AWS_PROFILE=common-projects scripts/deploy/create-data-api-service.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
export AWS_REGION=ap-south-1 AWS_PAGER=""
TF="terraform -chdir=infra/terraform/common"
out() { AWS_PROFILE=default $TF output -raw "$1"; }
outjson() { AWS_PROFILE=default $TF output -json "$1"; }

CLUSTER=$(out ecs_cluster)
IMAGE="$(out ecr_repo_url):common"
SUBNETS=$(outjson data_api_subnet_ids)
SG=$(out data_api_security_group_id)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws ecr describe-images --repository-name dbie/data-api --image-ids imageTag=common --query 'imageDetails[0].imagePushedAt' --output text >/dev/null

cat > /tmp/dbie-data-api-service.json <<JSON
{
  "cluster": "$CLUSTER",
  "serviceName": "data-api",
  "executionRoleArn": "$(out ecs_execution_role_arn)",
  "infrastructureRoleArn": "$(out ecs_infra_role_arn)",
  "taskRoleArn": "$(out data_api_task_role_arn)",
  "healthCheckPath": "/health",
  "primaryContainer": {
    "image": "$IMAGE",
    "containerPort": 8000,
    "awsLogsConfiguration": { "logGroup": "/ecs/dbie-data-api", "logStreamPrefix": "data-api" },
    "environment": [
      { "name": "ENVIRONMENT", "value": "common" },
      { "name": "AWS_REGION", "value": "ap-south-1" },
      { "name": "DB_SECRET_NAME", "value": "dbie/db-common-reader" },
      { "name": "PORT", "value": "8000" }
    ]
  },
  "networkConfiguration": { "subnets": $SUBNETS, "securityGroups": ["$SG"] },
  "cpu": "512",
  "memory": "1024",
  "scalingTarget": { "minTaskCount": 1, "maxTaskCount": 2, "autoScalingMetric": "AVERAGE_CPU", "autoScalingTargetValue": 70 },
  "tags": [ { "key": "Project", "value": "dbie" }, { "key": "Name", "value": "dbie-data-api" } ]
}
JSON
echo "creating data-api on $CLUSTER from $IMAGE (account $ACCOUNT)"
aws ecs create-express-gateway-service --cli-input-json file:///tmp/dbie-data-api-service.json --query 'service.[serviceName,status,serviceArn]' --output text
rm -f /tmp/dbie-data-api-service.json
echo "watch it come up:  aws ecs describe-express-gateway-service --cluster $CLUSTER --service data-api --query 'service.[status,ingressPaths]'"
