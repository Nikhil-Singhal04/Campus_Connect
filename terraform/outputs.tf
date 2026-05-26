output "aws_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS Account ID"
}

output "ecr_repository_name" {
  value       = aws_ecr_repository.app.name
  description = "ECR Repository Name"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS Cluster Name"
}

output "ecs_service_name" {
  value       = aws_ecs_service.backend.name
  description = "ECS Service Name"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 Bucket Name for Frontend"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.cdn.id
  description = "CloudFront Distribution ID"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.cdn.domain_name
  description = "CloudFront Domain Name (alternate access)"
}

output "route53_nameservers" {
  value       = aws_route53_zone.primary.name_servers
  description = "AWS Name Servers to copy to Hostinger"
}

# Helper data source to fetch active Account ID
data "aws_caller_identity" "current" {}
