# -----------------------------------------------------------------------------
# The API's hostname and TLS certificate. Pratirupa names one host per service
# and environment (platform-api.pratirupa.rbihub.in, uli-api.staging.…); DBIE
# has one environment, so data-api.dbie.rbihub.in. The dbie.rbihub.in zone is
# hosted in this account (it carries the site's records), so the certificate's
# validation records and the hostname itself are managed here.
#
# The hostname is served by CloudFront (cloudfront.tf) in front of the Express
# gateway, so the certificate is issued in us-east-1, as CloudFront requires.
# -----------------------------------------------------------------------------

variable "api_domain" {
  type    = string
  default = "data-api.dbie.rbihub.in"
}

data "aws_route53_zone" "dbie" {
  name = "dbie.rbihub.in."
}

resource "aws_acm_certificate" "api" {
  provider          = aws.use1
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
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for r in aws_route53_record.api_validation : r.fqdn]
}

output "api_domain" {
  value = var.api_domain
}

output "api_certificate_arn" {
  value = aws_acm_certificate.api.arn
}
