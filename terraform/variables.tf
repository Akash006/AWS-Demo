# ─── General ──────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy all resources into."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short name that prefixes every resource (e.g. 'quickbites')."
  type        = string
  default     = "quickbites"
}

variable "environment" {
  description = "Deployment environment tag (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

# ─── EC2 / Auto Scaling ───────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type for the application servers."
  type        = string
  default     = "t2.micro"
}

variable "ec2_key_pair_name" {
  description = "Name of an existing EC2 Key Pair for SSH access. Leave empty to disable SSH."
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into EC2 instances. Must be explicitly set — use your own IP (e.g. '203.0.113.0/32') and never open to 0.0.0.0/0 in production."
  type        = string
}

variable "docker_image" {
  description = "Docker image to run on EC2 instances."
  type        = string
  default     = "akash006/aws-demo-quickbites-webapp:v0427"
}

variable "app_port" {
  description = "Port the Node.js application listens on inside the container."
  type        = number
  default     = 3000
}

variable "asg_min_size" {
  description = "Minimum number of EC2 instances in the Auto Scaling Group."
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of EC2 instances in the Auto Scaling Group."
  type        = number
  default     = 3
}

variable "asg_desired_capacity" {
  description = "Desired number of EC2 instances in the Auto Scaling Group."
  type        = number
  default     = 1
}

# ─── DynamoDB ─────────────────────────────────────────────────────────────────

variable "dynamo_table_name" {
  description = "Name of the DynamoDB table that stores orders."
  type        = string
  default     = "quickbites-orders"
}

# ─── S3 ───────────────────────────────────────────────────────────────────────

variable "s3_bucket_name" {
  description = "Globally unique name for the S3 bucket used for file uploads."
  type        = string
}

variable "s3_cors_allowed_origins" {
  description = "List of origins allowed to make cross-origin requests to the S3 bucket (used for pre-signed URLs). Set to your application's domain in production."
  type        = list(string)
  default     = ["*"]
}

# ─── Cognito ──────────────────────────────────────────────────────────────────

variable "cognito_user_pool_name" {
  description = "Name of the Cognito User Pool."
  type        = string
  default     = "quickbites-users"
}

variable "cognito_app_client_name" {
  description = "Name of the Cognito app client (public browser client)."
  type        = string
  default     = "quickbites-web-client"
}

variable "cognito_domain_prefix" {
  description = "Unique prefix for the Cognito hosted-UI domain (e.g. 'quickbites-yourname'). Must be globally unique across all AWS accounts."
  type        = string
}

variable "cognito_callback_urls" {
  description = "Allowed OAuth callback URLs for the Cognito app client."
  type        = list(string)
  default     = ["https://example.com/oauth2/idpresponse"]
}

variable "cognito_logout_urls" {
  description = "Allowed sign-out (logout) URLs for the Cognito app client."
  type        = list(string)
  default     = ["https://example.com/"]
}
