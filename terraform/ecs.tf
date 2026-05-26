# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  tags = {
    Name = "${var.app_name}-cluster"
  }
}

# IAM Execution Role (Used by Fargate agent to pull ECR images and send logs to CloudWatch)
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Task Role (Allows container code to interact with other AWS services)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ecs-tasks.amazonaws.com" }
      }
    ]
  })
}

# CloudWatch Log Group for ECS Tasks
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.app_name}-backend"
  retention_in_days = 7
  tags = {
    Name = "${var.app_name}-log-group"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256" # 0.25 vCPU
  memory                   = "512" # 0.5 GB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
        }
      ]
      environment = [
        { name = "PORT", value = "4000" },
        { name = "DB_HOST", value = aws_db_instance.postgres.address },
        { name = "DB_PORT", value = tostring(aws_db_instance.postgres.port) },
        { name = "DB_NAME", value = aws_db_instance.postgres.db_name },
        { name = "DB_USER", value = aws_db_instance.postgres.username },
        { name = "DB_PASSWORD", value = var.db_password },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "OTP_PEPPER", value = var.otp_pepper },
        { name = "REQUIRE_EMAIL_OTP", value = var.require_email_otp },
        { name = "ADMIN_EMAIL", value = var.admin_email },
        { name = "ADMIN_PASSWORD", value = var.admin_password },
        { name = "RESEND_API_KEY", value = var.resend_api_key },
        { name = "RESEND_FROM_EMAIL", value = var.resend_from_email },
        { name = "FRONTEND_ORIGIN", value = "https://${var.domain_name},https://www.${var.domain_name},http://localhost:5500,http://127.0.0.1:5500" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

# ECS Fargate Service
resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 4000
  }

  // Allow ECR images to be created/pushed before running ECS service tasks
  depends_on = [aws_lb_listener.http, aws_lb_listener.https] 
}
