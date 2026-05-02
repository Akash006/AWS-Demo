#!/bin/bash
set -euxo pipefail

# ── Install Docker ──────────────────────────────────────────────────────────
if command -v yum >/dev/null 2>&1; then
  yum update -y
  yum install -y docker
fi

if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker.io
fi

systemctl enable --now docker

# ── Write application environment file ─────────────────────────────────────
cat > /etc/quickbites.env <<'ENVEOF'
PORT=${app_port}

ENABLE_DB=true
DB_TYPE=dynamodb
DYNAMO_TABLE=${dynamo_table_name}
DYNAMO_REGION=${aws_region}

ENABLE_S3=true
S3_BUCKET=${s3_bucket_name}
S3_REGION=${aws_region}
AWS_REGION=${aws_region}
ENVEOF

chmod 600 /etc/quickbites.env

# ── Start application container ─────────────────────────────────────────────
docker run -d \
  --name quickbites \
  --restart unless-stopped \
  -p 80:${app_port} \
  --env-file /etc/quickbites.env \
  ${docker_image}
