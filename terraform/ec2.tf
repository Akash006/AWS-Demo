# ── EC2 Security Group ────────────────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Allow HTTP from ALB and SSH from allowed CIDR"
  vpc_id      = data.aws_vpc.default.id

  # HTTP from the ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH — restrict allowed_ssh_cidr to your IP in production
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2-sg" })
}

# ── Launch Template ───────────────────────────────────────────────────────────

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.ec2_instance_type

  # Attach the IAM instance profile so the app can access DynamoDB and S3
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2.id]
  }

  # Key pair is optional — omit if no SSH access is needed
  key_name = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tpl", {
    aws_region        = var.aws_region
    app_port          = var.app_port
    dynamo_table_name = var.dynamo_table_name
    s3_bucket_name    = var.s3_bucket_name
    docker_image      = var.docker_image
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.common_tags, { Name = "${local.name_prefix}-app" })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.common_tags
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── Auto Scaling Group ────────────────────────────────────────────────────────

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-asg"
  vpc_zone_identifier = data.aws_subnets.default.ids
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity

  # Register instances with the ALB target group
  target_group_arns = [aws_lb_target_group.app.arn]

  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${local.name_prefix}-app" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── Auto Scaling Policy — scale on CPU ───────────────────────────────────────

resource "aws_autoscaling_policy" "cpu_tracking" {
  name                   = "${local.name_prefix}-cpu-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
