#!/bin/bash

# Variables (edit as needed)
BUCKET_NAME="cog-app01"
DIST_DIR="dist"

echo "Deploying to S3 bucket: $BUCKET_NAME"
aws s3 sync $DIST_DIR/ s3://$BUCKET_NAME/ --delete

echo "Deployment complete!"
