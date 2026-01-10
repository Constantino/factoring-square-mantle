provider "aws" {
  region  = "us-east-1"
  profile = "factoring-project"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "api-key"
  public_key = file("~/.ssh/factoring_rsa.pub")
}

resource "aws_security_group" "api" {
  name = "api-sg"

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "api" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  key_name      = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.api.id]
  user_data = file("provision.sh")
}

resource "aws_eip" "api" {
  instance = aws_instance.api.id
  domain   = "vpc"
}

output "ip" {
  value = aws_eip.api.public_ip
}