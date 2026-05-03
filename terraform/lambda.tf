# ── IAM Role for Lambda ───────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_role" {
  name        = "${local.name_prefix}-lambda-role"
  description = "Allows the image-label-detector Lambda to access S3, Rekognition, and CloudWatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# AWSLambdaBasicExecutionRole — grants permission to write logs to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Least-privilege inline policy: S3 read, Rekognition DetectLabels, CloudWatch PutMetricData
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "S3ReadObject"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Sid      = "RekognitionDetectLabels"
        Effect   = "Allow"
        Action   = ["rekognition:DetectLabels"]
        Resource = "*"
      },
      {
        Sid      = "CloudWatchPutMetrics"
        Effect   = "Allow"
        Action   = ["cloudwatch:PutMetricData"]
        Resource = "*"
      }
    ]
  })
}

# ── Lambda Deployment Package ─────────────────────────────────────────────────

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/image_label_detector.py"
  output_path = "${path.module}/../lambda/image_label_detector.zip"
}

# ── Lambda Function ───────────────────────────────────────────────────────────

resource "aws_lambda_function" "image_label_detector" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  function_name = "${local.name_prefix}-image-label-detector"
  role          = aws_iam_role.lambda_role.arn
  handler       = "image_label_detector.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-image-label-detector" })
}

# ── CloudWatch Log Group ──────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.image_label_detector.function_name}"
  retention_in_days = 14

  tags = local.common_tags
}

# ── Allow S3 to invoke the Lambda ─────────────────────────────────────────────

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_label_detector.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}

# ── S3 Event Notification → Lambda ────────────────────────────────────────────

locals {
  image_extensions = [".jpg", ".jpeg", ".png", ".webp"]
}

resource "aws_s3_bucket_notification" "uploads_trigger" {
  bucket = aws_s3_bucket.uploads.id

  dynamic "lambda_function" {
    for_each = local.image_extensions
    content {
      lambda_function_arn = aws_lambda_function.image_label_detector.arn
      events              = ["s3:ObjectCreated:*"]
      filter_suffix       = lambda_function.value
    }
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
