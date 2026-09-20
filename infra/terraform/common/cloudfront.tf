# -----------------------------------------------------------------------------
# CloudFront in front of the data API. The Express gateway's load balancer only
# answers requests addressed to the gateway's own *.on.aws name, and ECS moves
# the service between two target groups on every deployment, so neither a host
# rule nor a certificate of ours on that listener would survive. CloudFront
# presents data-api.dbie.rbihub.in with our certificate and forwards each
# request to the gateway under the gateway's name (AllViewerExceptHostHeader),
# which ECS's rule matches whatever it is doing behind it. The cache policy
# honours the API's own Cache-Control (public for 200, no-store otherwise) and
# keeps query strings in the cache key. Set api_gateway_dns_name from
# describe-express-gateway-service (terraform.tfvars).
# -----------------------------------------------------------------------------

variable "api_gateway_dns_name" {
  description = "The data API's Express gateway endpoint (describe-express-gateway-service → ingressPaths); empty until the service exists."
  type        = string
  default     = ""
}

# Cache policy of our own. The managed "UseOriginCacheControlHeaders" policies put the Host header in the cache
# key, and whatever is in the key is forwarded to the origin, which overrides the "except Host" origin request
# policy below and makes the gateway reject the request. This one keys on the query string only (filters, paging),
# forwards no headers, and honours the API's own Cache-Control: nothing is cached without it.
resource "aws_cloudfront_cache_policy" "api" {
  name        = "dbie-data-api"
  comment     = "Query string in the key, no headers; TTL from the API's Cache-Control only"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
    headers_config {
      header_behavior = "none"
    }
    cookies_config {
      cookie_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

# AWS-managed: forward every viewer header except Host, which becomes the origin's domain name.
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "api" {
  count = var.api_gateway_dns_name == "" ? 0 : 1

  enabled         = true
  comment         = "dbie data API: ${var.api_domain} -> ECS Express gateway"
  aliases         = [var.api_domain]
  http_version    = "http2and3"
  price_class     = "PriceClass_200" # includes India
  is_ipv6_enabled = true

  origin {
    origin_id   = "express-gateway"
    domain_name = var.api_gateway_dns_name

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 60 # a full CSV of the largest table
      origin_keepalive_timeout = 5
    }
  }

  default_cache_behavior {
    target_origin_id         = "express-gateway"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.api.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = { Name = var.api_domain }
}

resource "aws_route53_record" "api" {
  for_each = var.api_gateway_dns_name == "" ? toset([]) : toset(["A", "AAAA"])

  zone_id = data.aws_route53_zone.dbie.zone_id
  name    = var.api_domain
  type    = each.value

  alias {
    name                   = aws_cloudfront_distribution.api[0].domain_name
    zone_id                = aws_cloudfront_distribution.api[0].hosted_zone_id
    evaluate_target_health = false
  }
}

output "api_cloudfront_domain" {
  value = var.api_gateway_dns_name == "" ? null : aws_cloudfront_distribution.api[0].domain_name
}
