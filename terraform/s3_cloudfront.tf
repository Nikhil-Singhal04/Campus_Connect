# S3 Bucket for Frontend Assets
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.app_name}-frontend-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.app_name}-frontend-bucket"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Block S3 Public Access (Direct access is disabled, only CloudFront OAC can read)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.app_name}-oac"
  description                       = "CloudFront OAC for S3 Frontend Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy allowing CloudFront OAC read
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

# CloudFront Function for appending .html to clean URLs
resource "aws_cloudfront_function" "clean_urls" {
  name    = "${var.app_name}-clean-urls"
  runtime = "cloudfront-js-2.0"
  comment = "Appends .html extension to clean URL paths"
  publish = true
  code    = <<EOF
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    if (uri === '/') {
        return request;
    }
    
    var cleanUri = uri;
    if (uri.charAt(uri.length - 1) === '/') {
        cleanUri = uri.substring(0, uri.length - 1);
    }
    
    var lastSegment = cleanUri.substring(cleanUri.lastIndexOf('/') + 1);
    if (lastSegment && !lastSegment.includes('.')) {
        request.uri = cleanUri + '.html';
    }
    
    return request;
}
EOF
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Campus Connect CDN"
  default_root_object = "index.html"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  # Origin 1: S3 Bucket (Frontend)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Origin 2: ALB (Backend API)
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Backend"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
    }
  }

  # Default Cache Behavior (Frontend via S3)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.clean_urls.arn
    }
  }

  # Custom Cache Behavior for Backend API (/api/*) - Bypasses Caching and Forwards headers
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-Backend"

    forwarded_values {
      headers      = ["*"] # Forward all headers (Authorization, host, etc) for CORS/session consistency
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.app_name}-cloudfront"
  }
}
