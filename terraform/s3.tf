# ── S3 Bucket ─────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "uploads" {
  bucket = var.s3_bucket_name

  tags = merge(local.common_tags, { Name = var.s3_bucket_name })
}

# ── Block all public access ───────────────────────────────────────────────────

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Versioning ────────────────────────────────────────────────────────────────

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── CORS — allows browsers to use pre-signed URLs ─────────────────────────────

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.s3_cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}
