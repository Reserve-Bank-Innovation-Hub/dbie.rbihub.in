#!/bin/bash
# Joins the DBIE bastion to the RBIH tailnet as a subnet router for the VPC (172.31.0.0/16), the Pratirupa way.
# Run from a terminal: it prompts for a tagged (tag:dbie), pre-authorised, single-use auth key from the Tailscale
# admin console and passes it to the bastion over an SSM interactive command, so the key never goes into SSM command
# history or a chat. One-time per bastion. Reads BASTION_INSTANCE_ID and AWS_PROFILE from .env.common.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.common; set +a
: "${BASTION_INSTANCE_ID:?set BASTION_INSTANCE_ID in .env.common (terraform output bastion_instance_id)}"
read -r -s -p "Tailscale auth key (tskey-auth-…): " KEY; echo
[[ "$KEY" == tskey-auth-* ]] || { echo "that does not look like an auth key"; exit 1; }
aws ssm start-session --target "$BASTION_INSTANCE_ID" --document-name AWS-StartInteractiveCommand \
  --parameters "command=sudo tailscale up --auth-key=$KEY --advertise-routes=172.31.0.0/16 --advertise-tags=tag:dbie --hostname=dbie-bastion && sudo tailscale status | head -3"
