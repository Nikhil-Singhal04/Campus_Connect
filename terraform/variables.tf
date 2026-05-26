variable "aws_region" {
  type        = string
  description = "Target AWS Region"
  default     = "us-east-1"
}

variable "domain_name" {
  type        = string
  description = "Custom domain name purchased from Hostinger"
  default     = "campusconnect.online" # Placeholder domain
}

variable "db_username" {
  type        = string
  description = "PostgreSQL database admin username"
  default     = "postgres"
}

variable "db_password" {
  type        = string
  description = "PostgreSQL database admin password (should be overridden in production)"
  sensitive   = true
  default     = "CampusConnectPass123!"
}

variable "app_name" {
  type        = string
  description = "Application name for tagging and prefixing resource names"
  default     = "campus-connect"
}
