# -----------------------------------------------------------------------------
# Buckets. Two, both holding public RBI data, so both are readable by anyone
# (bucket policy on their prefixes) while only the release role and account
# admins can write. That is the one departure from Pratirupa's all-private
# buckets, and it is what lets a fresh clone run `pnpm data:fetch` and lets the
# Amplify build run `pnpm data:pull` with no credentials.
#
#   dbie-common-scrapes    scrapes/<date>/…   the raw files of each DBIE scrape,
#                                             immutable once written; the paper
#                                             trail behind the database
#   dbie-common-site-data  releases/<ver>/…   the site's JSON bundle, built from
#                                             the data by `pnpm data:release`;
#                                             releases/latest.json points at
#                                             the current one
# -----------------------------------------------------------------------------

locals {
  scrapes_bucket   = "dbie-common-scrapes"
  site_data_bucket = "dbie-common-site-data"
}

# --- scrape archive ----------------------------------------------------------

resource "aws_s3_bucket" "scrapes" {
  bucket = local.scrapes_bucket
  tags   = { Name = local.scrapes_bucket }
}

resource "aws_s3_bucket_ownership_controls" "scrapes" {
  bucket = aws_s3_bucket.scrapes.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "scrapes" {
  bucket = aws_s3_bucket.scrapes.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ACLs stay blocked; the bucket policy below is the only public grant.
resource "aws_s3_bucket_public_access_block" "scrapes" {
  bucket                  = aws_s3_bucket.scrapes.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "scrapes" {
  bucket     = aws_s3_bucket.scrapes.id
  depends_on = [aws_s3_bucket_public_access_block.scrapes]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = "${aws_s3_bucket.scrapes.arn}/*"
      },
      {
        Sid       = "PublicList"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:ListBucket"]
        Resource  = aws_s3_bucket.scrapes.arn
      },
    ]
  })
}

# Old scrapes are rarely read: cheaper storage after 90 days, never deleted.
resource "aws_s3_bucket_lifecycle_configuration" "scrapes" {
  bucket = aws_s3_bucket.scrapes.id
  rule {
    id     = "scrapes-to-infrequent-access"
    status = "Enabled"
    filter {
      prefix = "scrapes/"
    }
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# --- site data releases ------------------------------------------------------

resource "aws_s3_bucket" "site_data" {
  bucket = local.site_data_bucket
  tags   = { Name = local.site_data_bucket }
}

resource "aws_s3_bucket_ownership_controls" "site_data" {
  bucket = aws_s3_bucket.site_data.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site_data" {
  bucket = aws_s3_bucket.site_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "site_data" {
  bucket                  = aws_s3_bucket.site_data.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "site_data" {
  bucket     = aws_s3_bucket.site_data.id
  depends_on = [aws_s3_bucket_public_access_block.site_data]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = "${aws_s3_bucket.site_data.arn}/*"
      },
      {
        Sid       = "PublicList"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:ListBucket"]
        Resource  = aws_s3_bucket.site_data.arn
      },
    ]
  })
}

# A release is only needed until the next few supersede it; latest.json is
# rewritten on every release and never expires.
resource "aws_s3_bucket_lifecycle_configuration" "site_data" {
  bucket = aws_s3_bucket.site_data.id
  rule {
    id     = "expire-old-releases"
    status = "Enabled"
    filter {
      prefix = "releases/"
    }
    expiration {
      days = 180
    }
  }
}
