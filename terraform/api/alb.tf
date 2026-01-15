# ----------------------------
# Get default VPC and subnets
# ----------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ----------------------------
# Security group for ALB
# ----------------------------
resource "aws_security_group" "alb" {
  name        = "alb-https-sg"
  description = "Allow HTTPS and HTTP traffic to ALB"
  vpc_id      = data.aws_vpc.default.id

  # Allow HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  # Allow HTTP (for redirect to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "alb-security-group"
  }
}

# ----------------------------
# Update EC2 security group to allow ALB traffic
# ----------------------------
resource "aws_security_group_rule" "ec2_from_alb" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  security_group_id        = aws_security_group.api.id
  source_security_group_id = aws_security_group.alb.id
  description              = "Allow traffic from ALB to app port"
}

# ----------------------------
# ACM Certificate (Free SSL from AWS)
# ----------------------------
resource "aws_acm_certificate" "api" {
  count = var.create_alb && var.domain_name != "" ? 1 : 0

  domain_name       = "${var.api_subdomain}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "factoring-api-certificate"
  }
}

# ----------------------------
# Route53 Hosted Zone (if domain is managed in Route53)
# ----------------------------
data "aws_route53_zone" "domain" {
  count = var.create_alb && var.domain_name != "" ? 1 : 0

  name         = var.domain_name
  private_zone = false
}

# ----------------------------
# DNS validation records for ACM certificate
# ----------------------------
resource "aws_route53_record" "cert_validation" {
  for_each = var.create_alb && var.domain_name != "" ? {
    for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.domain[0].zone_id
}

# ----------------------------
# Wait for certificate validation
# ----------------------------
resource "aws_acm_certificate_validation" "api" {
  count = var.create_alb && var.domain_name != "" ? 1 : 0

  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ----------------------------
# Route53 A record pointing to ALB
# ----------------------------
resource "aws_route53_record" "api" {
  count = var.create_alb && var.domain_name != "" ? 1 : 0

  zone_id = data.aws_route53_zone.domain[0].zone_id
  name    = "${var.api_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.api[0].dns_name
    zone_id                = aws_lb.api[0].zone_id
    evaluate_target_health = true
  }
}

# ----------------------------
# Application Load Balancer
# ----------------------------
resource "aws_lb" "api" {
  count = var.create_alb ? 1 : 0

  name               = "factoring-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids

  enable_deletion_protection = false

  tags = {
    Name = "factoring-api-alb"
  }
}

# ----------------------------
# Target Group
# ----------------------------
resource "aws_lb_target_group" "api" {
  count = var.create_alb ? 1 : 0

  name        = "factoring-api-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/"
    port                = "3001"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "factoring-api-target-group"
  }
}

# Attach EC2 instance to target group
resource "aws_lb_target_group_attachment" "api" {
  count = var.create_alb ? 1 : 0

  target_group_arn = aws_lb_target_group.api[0].arn
  target_id        = aws_instance.api.id
  port             = 3001
}

# ----------------------------
# HTTP Listener (redirect to HTTPS)
# ----------------------------
resource "aws_lb_listener" "http" {
  count = var.create_alb ? 1 : 0

  load_balancer_arn = aws_lb.api[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ----------------------------
# HTTPS Listener
# ----------------------------
resource "aws_lb_listener" "https" {
  count = var.create_alb ? 1 : 0

  load_balancer_arn = aws_lb.api[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.domain_name != "" ? aws_acm_certificate_validation.api[0].certificate_arn : null

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api[0].arn
  }
}

# ----------------------------
# Outputs
# ----------------------------
output "api_url" {
  value = var.create_alb ? (
    var.domain_name != "" ? "https://${var.api_subdomain}.${var.domain_name}" : "https://${aws_lb.api[0].dns_name}"
  ) : "http://${aws_eip.api.public_ip}:3001"
  description = "API endpoint URL"
}

output "alb_dns_name" {
  value       = var.create_alb ? aws_lb.api[0].dns_name : null
  description = "ALB DNS name (if ALB is created)"
}

output "certificate_arn" {
  value       = var.create_alb && var.domain_name != "" ? aws_acm_certificate.api[0].arn : null
  description = "ACM certificate ARN (if domain is provided)"
}
