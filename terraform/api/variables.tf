# ----------------------------
# Variables
# ----------------------------

variable "domain_name" {
  description = "Your domain name (e.g., example.com)"
  type        = string
  default     = ""
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., 'api' will create api.example.com)"
  type        = string
  default     = "api"
}

variable "create_alb" {
  description = "Whether to create ALB with HTTPS"
  type        = bool
  default     = false
}
