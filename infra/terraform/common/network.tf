# -----------------------------------------------------------------------------
# Network. The common-projects account keeps its default VPC (172.31.0.0/16,
# one public subnet per AZ) and DBIE runs inside it: the database has no public
# address and its security group admits port 5432 from the bastion's group only.
# The bastion advertises the VPC to the RBIH tailnet (see bastion.tf), and its
# traffic to the database is NATed to its own address, so that one rule covers
# every tailnet client. Standalone rule resources, as in Pratirupa.
# -----------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_subnet" "bastion" {
  vpc_id            = data.aws_vpc.default.id
  availability_zone = "${var.region}a"
  default_for_az    = true
}

resource "aws_security_group" "bastion" {
  name        = "dbie-bastion-sg"
  description = "DBIE bastion: SSM only, no inbound"
  vpc_id      = data.aws_vpc.default.id
  tags        = { Name = "dbie-bastion-sg" }
}

resource "aws_vpc_security_group_egress_rule" "bastion_all" {
  security_group_id = aws_security_group.bastion.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_security_group" "db" {
  name        = "dbie-db-sg"
  description = "DBIE Postgres: 5432 from bastion SG only"
  vpc_id      = data.aws_vpc.default.id
  tags        = { Name = "dbie-db-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_bastion" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  description                  = "bastion"
}

resource "aws_vpc_security_group_egress_rule" "db_all" {
  security_group_id = aws_security_group.db.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
