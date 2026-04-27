#!/bin/bash
# Run this script on the server whenever you update /etc/quickbites.env
# or want to pull the latest Docker image.
set -euxo pipefail

IMAGE="akash006/aws-demo-quickbites-webapp:v0427"
ENV_FILE="/etc/quickbites.env"

echo "Pulling latest image..."
docker pull "$IMAGE"

echo "Stopping old container..."
docker rm -f quickbites || true

echo "Starting container with updated env..."
docker run -d \
  --name quickbites \
  --restart unless-stopped \
  -p 80:3000 \
  --env-file "$ENV_FILE" \
  "$IMAGE"

echo "Done. App is running on port 3000."
echo "Logs: docker logs -f quickbites"
