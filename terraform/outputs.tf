output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer. Point your domain's CNAME here."
  value       = aws_lb.app.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the ALB (needed for Route 53 alias records)."
  value       = aws_lb.app.zone_id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB orders table."
  value       = aws_dynamodb_table.orders.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB orders table."
  value       = aws_dynamodb_table.orders.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket used for file uploads."
  value       = aws_s3_bucket.uploads.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 uploads bucket."
  value       = aws_s3_bucket.uploads.arn
}

output "ec2_iam_role_arn" {
  description = "ARN of the IAM role attached to EC2 instances."
  value       = aws_iam_role.ec2_role.arn
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool."
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_app_client_id" {
  description = "ID of the Cognito app client."
  value       = aws_cognito_user_pool_client.web_client.id
}

output "cognito_hosted_ui_domain" {
  description = "Cognito hosted-UI base URL (used for sign-in/sign-up pages)."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "lambda_function_name" {
  description = "Name of the image-label-detector Lambda function."
  value       = aws_lambda_function.image_label_detector.function_name
}

output "lambda_function_arn" {
  description = "ARN of the image-label-detector Lambda function."
  value       = aws_lambda_function.image_label_detector.arn
}

output "lambda_cloudwatch_log_group" {
  description = "CloudWatch Log Group where Lambda execution logs are stored."
  value       = aws_cloudwatch_log_group.lambda_logs.name
}
