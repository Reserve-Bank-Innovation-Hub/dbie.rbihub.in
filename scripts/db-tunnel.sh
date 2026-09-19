#!/bin/bash
# SSM port-forward from localhost:15432 (or $1) to the DBIE Postgres instance via the bastion, for a machine that is
# not on the RBIH tailnet. Reads BASTION_INSTANCE_ID, AWS_PROFILE and DB_SECRET_NAME from .env.common (see
# .env.common.example) and the host from the secret. Needs the AWS CLI and the Session Manager plugin. Ctrl-C closes it.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.common; set +a
: "${BASTION_INSTANCE_ID:?set BASTION_INSTANCE_ID in .env.common (terraform output bastion_instance_id)}"
HOST=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_NAME" --query SecretString --output text | python3 -c 'import sys,json; print(json.load(sys.stdin)["host"])')
PORT="${1:-15432}"
echo "forwarding localhost:$PORT -> $HOST:5432 via $BASTION_INSTANCE_ID (Ctrl-C to stop)"
exec aws ssm start-session --target "$BASTION_INSTANCE_ID" --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "host=$HOST,portNumber=5432,localPortNumber=$PORT"
