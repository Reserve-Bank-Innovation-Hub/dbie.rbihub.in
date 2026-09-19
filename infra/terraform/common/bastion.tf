# -----------------------------------------------------------------------------
# Bastion — t4g.nano, Amazon Linux 2023, reached only via SSM Session Manager
# (no SSH, no inbound rules, IMDSv2). It has a public address only so it can
# reach the SSM and Tailscale services from the default VPC, which has no NAT.
# It runs the Tailscale subnet router for 172.31.0.0/16 (tag:dbie), the way each
# Pratirupa account's bastion does; joining is a one-time manual step
# (scripts/db-bastion-tailscale-up.sh) because it needs a tailnet auth key.
#
# The AMI resolves from the "latest AL2023" SSM parameter, which AWS advances as
# new images ship; AMI and user_data drift are ignored so an unrelated apply
# never replaces the running router. Patched in place (dnf via SSM).
# -----------------------------------------------------------------------------

data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_iam_role" "bastion" {
  name = "dbie-bastion-ssm"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Name = "dbie-bastion-ssm" }
}

resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "bastion" {
  name = "dbie-bastion-ssm"
  role = aws_iam_role.bastion.name
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ssm_parameter.al2023_arm64.value
  instance_type               = "t4g.nano"
  subnet_id                   = data.aws_subnet.bastion.id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  iam_instance_profile        = aws_iam_instance_profile.bastion.name
  associate_public_ip_address = true
  user_data                   = file("${path.module}/bastion-userdata.sh")

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = { Name = "dbie-bastion" }
}
