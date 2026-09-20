# -----------------------------------------------------------------------------
# The API's hostname and TLS certificate. Pratirupa names one host per service
# and environment (platform-api.pratirupa.rbihub.in, uli-api.staging.…); DBIE
# has one environment, so data-api.dbie.rbihub.in. The dbie.rbihub.in zone is
# hosted in this account (it carries the site's records), so the certificate's
# validation records and the hostname itself are managed here, unlike
# Pratirupa's management-account zone.
#
# The hostname points at the Express gateway's load balancer, whose DNS name
# exists only once scripts/deploy/create-data-api-service.sh has run: set
# api_gateway_dns_name (terraform.tfvars) and apply again to add the record.
# -----------------------------------------------------------------------------

variable "api_domain" {
  type    = string
  default = "data-api.dbie.rbihub.in"
}

variable "api_gateway_dns_name" {
  description = "The data API's Express gateway endpoint (describe-express-gateway-service → ingressPaths); empty until the service exists."
  type        = string
  default     = ""
}

variable "api_gateway_listener_arn" {
  description = "The HTTPS listener of the load balancer ECS created for the Express gateway; empty until the service exists."
  type        = string
  default     = ""
}

data "aws_route53_zone" "dbie" {
  name = "dbie.rbihub.in."
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain
  validation_method = "DNS"
  tags              = { Name = var.api_domain }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_validation" {
  for_each = { for o in aws_acm_certificate.api.domain_validation_options : o.domain_name => o }

  zone_id         = data.aws_route53_zone.dbie.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = 300
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for r in aws_route53_record.api_validation : r.fqdn]
}

resource "aws_route53_record" "api" {
  count = var.api_gateway_dns_name == "" ? 0 : 1

  zone_id = data.aws_route53_zone.dbie.zone_id
  name    = var.api_domain
  type    = "CNAME"
  ttl     = 300
  records = [var.api_gateway_dns_name]
}

# The gateway's listener carries an AWS-managed certificate for the gateway's own *.on.aws name; Express has no
# custom-domain option, so our certificate is attached to that listener as an extra (SNI) certificate. ECS owns
# the load balancer: if it ever recreates the gateway, update the two variables above and apply again.
resource "aws_lb_listener_certificate" "api" {
  count = var.api_gateway_listener_arn == "" ? 0 : 1

  listener_arn    = var.api_gateway_listener_arn
  certificate_arn = aws_acm_certificate_validation.api.certificate_arn
}

output "api_domain" {
  value = var.api_domain
}

output "api_certificate_arn" {
  value = aws_acm_certificate.api.arn
}
