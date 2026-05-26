variable "aws_region" {
  type        = string
  description = "Target AWS Region"
  default     = "us-east-1"
}

variable "domain_name" {
  type        = string
  description = "Custom domain name purchased from Hostinger"
  default     = "campusconnect.cfd" # Placeholder domain
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
  default     = "Nikhil09Abhi18"
}

variable "app_name" {
  type        = string
  description = "Application name for tagging and prefixing resource names"
  default     = "campus-connect"
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret key for token authentication"
  default     = "your_super_secret_jwt_key_change_this_in_production_1234567890"
}

variable "otp_pepper" {
  type        = string
  description = "Salt/Pepper value for hashing OTP codes"
  default     = "your_otp_pepper_secret_change_this_in_production_1234567890"
}

variable "require_email_otp" {
  type        = string
  description = "Require email OTP verification for signup (true or false)"
  default     = "true"
}

variable "admin_email" {
  type        = string
  description = "Default admin user email address"
  default     = "admin@campus-connect.local"
}

variable "admin_password" {
  type        = string
  description = "Default admin user password"
  default     = "admin123456"
}

variable "resend_api_key" {
  type        = string
  description = "Resend API Key for email OTP verification"
  sensitive   = true
  default     = "re_Ta5RBexe_DF3fVqNPt61GLoLUG1HX3yWy"
}

variable "resend_from_email" {
  type        = string
  description = "From email address for Resend notifications"
  default     = "Campus Connect <noreply@campusconnect.cfd>"
}


