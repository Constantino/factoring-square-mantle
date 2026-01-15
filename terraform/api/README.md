# API Infrastructure - Terraform

## Prerequisites

1. **AWS CLI configured** with your credentials
2. **Terraform installed** (>= 1.0)
3. **Domain registered** (if using HTTPS with ALB)
4. **Domain managed in Route53** (if using HTTPS with ALB)

## Option 1: Deploy WITHOUT ALB (Simple, HTTP only)

```bash
terraform init
terraform apply
```

This will create:
- EC2 instance with API
- Security group
- Elastic IP

Access your API at: `http://<elastic-ip>:3001`

## Option 2: Deploy WITH ALB + HTTPS (Recommended for Production)

### Step 1: Register your domain in Route53

1. Go to AWS Route53
2. Register a domain or transfer existing domain
3. Wait for domain to be active (can take 10-15 minutes)

### Step 2: Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
create_alb    = true
domain_name   = "yourdomain.com"    # Your actual domain
api_subdomain = "api"                # Creates api.yourdomain.com
```

### Step 3: Deploy

```bash
terraform init
terraform plan
terraform apply
```

This will create:
- Everything from Option 1
- Application Load Balancer (ALB)
- ALB Security Group
- Target Group
- ACM SSL Certificate (FREE!)
- DNS validation records
- Route53 A record pointing to ALB

**Note:** Certificate validation can take 5-30 minutes. Terraform will wait automatically.

### Step 4: Get your HTTPS URL

```bash
terraform output api_url
```

You'll see: `https://api.yourdomain.com`

### Step 5: Update Vercel

In Vercel dashboard, set:
```
NEXT_PUBLIC_API_URL=api.yourdomain.com
```

**Done!** Your API now has:
- ✅ Real HTTPS certificate (trusted by all browsers)
- ✅ Auto-renewal (AWS handles it)
- ✅ Load balancing
- ✅ Health checks
- ✅ No mixed content errors

## Costs

- **EC2 t2.micro**: Free tier eligible (750 hours/month)
- **Application Load Balancer**: ~$16/month
- **Route53 Hosted Zone**: $0.50/month
- **Domain Registration**: ~$12-15/year (one-time, then annual renewal)
- **ACM Certificate**: **FREE** ✅

**Total monthly cost: ~$16.50** (after free tier)

## Troubleshooting

### Health checks failing

Check if API is running:
```bash
ssh -i ~/.ssh/factoring_rsa ubuntu@<ec2-ip>
pm2 list
curl http://localhost:3001
```

### Certificate validation stuck

Check DNS propagation:
```bash
dig api.yourdomain.com
```

Wait a few minutes and run `terraform apply` again.

### Domain not in Route53

If your domain is registered elsewhere (GoDaddy, Namecheap, etc):

1. Create hosted zone in Route53
2. Update nameservers at your registrar to point to Route53
3. Wait 24-48 hours for propagation
4. Run `terraform apply`

## Destroying Infrastructure

To delete everything:
```bash
terraform destroy
```

**Warning:** This will delete your certificate, ALB, and DNS records!

## Alternative: Use Cloudflare (if you don't want to pay for ALB)

See `setup-cloudflare-tunnel.sh` for a free HTTPS solution using Cloudflare Tunnel.
