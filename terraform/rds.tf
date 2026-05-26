resource "aws_db_subnet_group" "main" {
  name        = "${var.app_name}-db-subnet-group"
  description = "DB subnet group for PostgreSQL database"
  subnet_ids  = [aws_subnet.db_1.id, aws_subnet.db_2.id]
  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.app_name}-postgres"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "15.4" 
  instance_class         = "db.t3.micro" # Free-tier eligible instance class
  db_name                = "campus_connect"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot    = true
  
  tags = {
    Name = "${var.app_name}-db"
  }
}
