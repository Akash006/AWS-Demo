# QuickBites — Terraform Infrastructure

This directory contains Terraform configuration files that provision all AWS resources required to run the QuickBites application.

---

## Resources Provisioned

| Resource | Description |
|---|---|
| **EC2 Launch Template** | Ubuntu 22.04, runs the app inside Docker |
| **Auto Scaling Group** | Scales EC2 instances based on CPU utilization |
| **Application Load Balancer** | Public-facing ALB with HTTP listener |
| **Security Groups** | ALB (80/443 public) and EC2 (80 from ALB, 22 SSH) |
| **DynamoDB Table** | `quickbites-orders` — stores food orders |
| **S3 Bucket** | Private bucket for image uploads (with CORS for signed URLs) |
| **IAM Role + Instance Profile** | Grants EC2 access to DynamoDB and S3 via instance metadata |
| **Cognito User Pool** | Email-based sign-up/sign-in with hosted UI and OAuth 2.0 |
| **Lambda Function** | `image-label-detector` — auto-triggered on S3 image uploads; uses Rekognition to classify food vs non-food images and publishes CloudWatch metrics |
| **IAM Role (Lambda)** | Grants the Lambda function least-privilege access to S3, Rekognition, and CloudWatch |
| **CloudWatch Log Group** | Stores Lambda execution logs with 14-day retention |

---

## File Structure

```
terraform/
├── main.tf                   # Provider, data sources (VPC, subnets, Ubuntu AMI)
├── variables.tf              # All input variable declarations
├── outputs.tf                # Useful outputs (ALB DNS, bucket name, Cognito IDs, etc.)
├── ec2.tf                    # Security group, launch template, ASG, scaling policy
├── alb.tf                    # ALB, target group, HTTP listener, security group
├── iam.tf                    # IAM role, policy attachments, instance profile
├── dynamodb.tf               # DynamoDB orders table
├── s3.tf                     # S3 bucket, public access block, versioning, CORS
├── cognito.tf                # Cognito user pool, app client, hosted-UI domain
├── lambda.tf                 # Lambda function, IAM role, S3 trigger, CloudWatch log group
├── templates/
│   └── user_data.sh.tpl      # EC2 bootstrap script template (installs Docker, starts app)
├── terraform.tfvars.example  # Example variables file — copy to terraform.tfvars
└── README.md                 # This file
```

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.3.0
- AWS credentials configured (`aws configure` or environment variables)
- An existing **EC2 Key Pair** in the target region (if SSH access is needed)

---

## Quick Start

```bash
# 1. Copy and fill in the variables file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — at minimum set: s3_bucket_name, ec2_key_pair_name, cognito_domain_prefix

# 2. Initialize Terraform (downloads the AWS provider)
terraform init

# 3. Preview the changes
terraform plan

# 4. Apply the changes
terraform apply
```

After `terraform apply` completes, the **ALB DNS name** is printed as an output. Point your domain's CNAME record to that value.

---

## Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `aws_region` | No | `ap-south-1` | AWS region |
| `project_name` | No | `quickbites` | Prefix for all resource names |
| `environment` | No | `dev` | Environment tag |
| `ec2_instance_type` | No | `t2.micro` | EC2 instance type |
| `ec2_key_pair_name` | No | `""` | Existing EC2 Key Pair name (leave empty for no SSH) |
| `allowed_ssh_cidr` | **Yes** | — | CIDR for SSH — must be explicitly set to your IP |
| `docker_image` | No | latest tag | Docker image for the app |
| `app_port` | No | `3000` | Container port the Node.js app listens on |
| `asg_min_size` | No | `1` | ASG minimum instance count |
| `asg_max_size` | No | `3` | ASG maximum instance count |
| `asg_desired_capacity` | No | `1` | ASG desired instance count |
| `dynamo_table_name` | No | `quickbites-orders` | DynamoDB table name |
| `s3_bucket_name` | **Yes** | — | Globally unique S3 bucket name |
| `s3_cors_allowed_origins` | No | `["*"]` | Origins allowed for S3 CORS (set to your domain in production) |
| `cognito_user_pool_name` | No | `quickbites-users` | Cognito user pool name |
| `cognito_app_client_name` | No | `quickbites-web-client` | Cognito app client name |
| `cognito_domain_prefix` | **Yes** | — | Globally unique Cognito hosted-UI domain prefix |
| `cognito_callback_urls` | No | example.com | OAuth callback URLs |
| `cognito_logout_urls` | No | example.com | OAuth logout URLs |

---

## Outputs

| Output | Description |
|---|---|
| `alb_dns_name` | DNS name of the load balancer |
| `alb_zone_id` | Hosted zone ID (for Route 53 alias records) |
| `dynamodb_table_name` | DynamoDB table name |
| `dynamodb_table_arn` | DynamoDB table ARN |
| `s3_bucket_name` | S3 bucket name |
| `s3_bucket_arn` | S3 bucket ARN |
| `ec2_iam_role_arn` | IAM role ARN attached to EC2 |
| `cognito_user_pool_id` | Cognito User Pool ID |
| `cognito_user_pool_arn` | Cognito User Pool ARN |
| `cognito_app_client_id` | Cognito App Client ID |
| `cognito_hosted_ui_domain` | Cognito hosted-UI base URL |
| `lambda_function_name` | Name of the image-label-detector Lambda function |
| `lambda_function_arn` | ARN of the image-label-detector Lambda function |
| `lambda_cloudwatch_log_group` | CloudWatch Log Group for Lambda logs |

---

## Lambda Demo — Image Food Classifier

The `lambda.tf` file provisions an event-driven image classification pipeline:

| Component | Details |
|---|---|
| **Trigger** | S3 `ObjectCreated` event for `.jpg`, `.jpeg`, `.png`, `.webp` files |
| **Service** | Amazon Rekognition `DetectLabels` |
| **Classification** | Checks detected labels against a curated set of food-related keywords |
| **Logging** | Structured log lines written to CloudWatch Logs (`/aws/lambda/<function-name>`) |
| **Metrics** | Custom CloudWatch metrics in namespace `QuickBites/ImageLabels` |

### How it works

1. A user uploads an image via the QuickBites web app (or directly to S3).
2. S3 automatically invokes the Lambda function with the bucket name and object key.
3. Lambda calls **Rekognition** to detect up to 20 labels (minimum confidence 70 %).
4. If any label matches a food keyword the function:
   - Logs `FOOD IMAGE DETECTED` with the matching labels.
   - Increments the `FoodImageCount` CloudWatch metric.
5. Otherwise the function:
   - Logs `NON-FOOD IMAGE DETECTED` with all detected labels.
   - Increments the `NonFoodImageCount` CloudWatch metric.
6. `TotalImagesProcessed` is always incremented; `ProcessingErrors` is incremented on failures.

### Viewing the metrics

```bash
# Stream Lambda logs
aws logs tail /aws/lambda/<lambda_function_name output> --follow

# Query food vs non-food counts (last hour)
aws cloudwatch get-metric-statistics \
  --namespace QuickBites/ImageLabels \
  --metric-name FoodImageCount \
  --dimensions Name=BucketName,Value=<s3_bucket_name output> \
  --start-time $(date -u -d '1 hour ago' +%FT%TZ) \
  --end-time   $(date -u +%FT%TZ) \
  --period 3600 \
  --statistics Sum
```

---

## Tear Down

```bash
terraform destroy
```

> **Note:** Destroying the S3 bucket will fail if it contains objects. Empty the bucket first via the AWS Console or AWS CLI.